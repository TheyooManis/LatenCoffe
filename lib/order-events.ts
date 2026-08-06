import pg from "pg";

const CHANNEL = "order_changed";
const RECONNECT_DELAY_MS = 2_000;

type Listener = () => void;

type Hub = {
  listeners: Set<Listener>;
  client: pg.Client | null;
  connecting: Promise<void> | null;
};

// Survives dev hot-reloads so we don't leak a Postgres connection per edit.
const globalForHub = globalThis as unknown as { orderEventHub?: Hub };

const hub: Hub = (globalForHub.orderEventHub ??= {
  listeners: new Set(),
  client: null,
  connecting: null,
});

/**
 * LISTEN needs a session-mode connection — a transaction-mode pooler (pgBouncer)
 * hands the connection back after each statement and silently drops
 * notifications, so DIRECT_DATABASE_URL (port 6543) must not be used here.
 */
function connectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for order events (session-mode connection).",
    );
  }
  return url;
}

function scheduleReconnect() {
  hub.client = null;
  hub.connecting = null;
  if (hub.listeners.size === 0) return;
  setTimeout(() => {
    void ensureListening().catch(() => scheduleReconnect());
  }, RECONNECT_DELAY_MS);
}

async function ensureListening(): Promise<void> {
  if (hub.client) return;
  if (hub.connecting) return hub.connecting;

  hub.connecting = (async () => {
    const client = new pg.Client({ connectionString: connectionString() });

    client.on("notification", (message) => {
      if (message.channel !== CHANNEL) return;
      for (const listener of hub.listeners) listener();
    });
    client.on("error", () => scheduleReconnect());
    client.on("end", () => scheduleReconnect());

    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    hub.client = client;
  })();

  try {
    await hub.connecting;
  } catch (error) {
    scheduleReconnect();
    throw error;
  } finally {
    hub.connecting = null;
  }
}

/**
 * Calls `onChange` whenever any row in "Order" is written, via the database
 * trigger that issues NOTIFY. Returns an unsubscribe function.
 */
export async function subscribeToOrderChanges(onChange: Listener) {
  hub.listeners.add(onChange);

  try {
    await ensureListening();
  } catch (error) {
    hub.listeners.delete(onChange);
    throw error;
  }

  return () => {
    hub.listeners.delete(onChange);
    if (hub.listeners.size === 0 && hub.client) {
      const client = hub.client;
      hub.client = null;
      void client.end().catch(() => {});
    }
  };
}
