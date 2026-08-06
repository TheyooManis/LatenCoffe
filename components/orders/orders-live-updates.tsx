"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Only used while the push stream is down (server restart, network blip), so a
 * missed order can never sit unseen. The live path is push, not this.
 */
const FALLBACK_POLL_MS = 15_000;

type Connection = "connecting" | "live" | "offline";

/**
 * Keeps the kasir/dapur board current without anyone touching the page.
 *
 * Updates arrive over Server-Sent Events, woken by a Postgres NOTIFY trigger —
 * both stock parts, so switching Postgres hosts later changes nothing here.
 * The event is only a signal; the orders themselves are re-fetched through the
 * authenticated page.
 */
export function OrdersLiveUpdates() {
  const router = useRouter();
  const [connection, setConnection] = useState<Connection>("connecting");

  useEffect(() => {
    const source = new EventSource("/api/orders/stream");

    source.addEventListener("ready", () => setConnection("live"));
    source.addEventListener("order-changed", () => router.refresh());
    // EventSource reconnects on its own; reflect the gap in the UI meanwhile.
    source.onerror = () => setConnection("offline");
    source.onopen = () => setConnection("live");

    return () => source.close();
  }, [router]);

  useEffect(() => {
    if (connection === "live") return;

    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, FALLBACK_POLL_MS);

    return () => clearInterval(id);
  }, [connection, router]);

  // A stale board looks identical to a quiet one, so say which it is.
  const label =
    connection === "live"
      ? "Terhubung langsung"
      : connection === "connecting"
        ? "Menyambungkan..."
        : "Sambungan putus, mencoba lagi";

  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connection === "live"
            ? "animate-pulse bg-emerald-500"
            : connection === "connecting"
              ? "bg-zinc-400"
              : "bg-amber-500"
        }`}
      />
      {label}
    </span>
  );
}
