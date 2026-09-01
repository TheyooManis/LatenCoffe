/**
 * Browser-side cart, kept per table.
 *
 * Only ids, quantity, and the note are persisted — never names or prices.
 * Those are resolved from the live menu on every render, so a cart left open
 * overnight can never show a stale price, and the server prices the order from
 * the database regardless of what the browser sends.
 */
export type CartLine = {
  menuItemId: string;
  /** Chosen options (size, toppings). Stored sorted so the key is stable. */
  optionIds: string[];
  quantity: number;
  note: string | null;
};

export const MAX_QUANTITY = 20;

const STORAGE_PREFIX = "latencoffee.cart.";

/** Shared frozen reference so `getSnapshot` stays stable for an empty cart. */
export const EMPTY_CART: readonly CartLine[] = Object.freeze([]);

const snapshots = new Map<string, readonly CartLine[]>();
const listeners = new Set<() => void>();

/**
 * Identity of a cart row. The same drink ordered twice with different options
 * is two rows; with identical options it is one row with quantity 2.
 */
export function cartLineKey(menuItemId: string, optionIds: readonly string[]) {
  return [menuItemId, ...[...optionIds].sort()].join("|");
}

export function lineKeyOf(line: CartLine) {
  return cartLineKey(line.menuItemId, line.optionIds);
}

function storageKey(tableToken: string) {
  return `${STORAGE_PREFIX}${tableToken}`;
}

function parseStored(raw: string | null): readonly CartLine[] {
  if (!raw) return EMPTY_CART;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_CART;
  }
  if (!Array.isArray(parsed)) return EMPTY_CART;

  const lines: CartLine[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const { menuItemId, optionIds, quantity, note } = entry as Record<
      string,
      unknown
    >;
    if (typeof menuItemId !== "string" || !menuItemId) continue;
    if (!Number.isInteger(quantity)) continue;
    const amount = quantity as number;
    if (amount < 1 || amount > MAX_QUANTITY) continue;

    lines.push({
      menuItemId,
      optionIds: Array.isArray(optionIds)
        ? optionIds.filter((id): id is string => typeof id === "string").sort()
        : [],
      quantity: amount,
      note: typeof note === "string" && note ? note : null,
    });
  }

  return lines.length > 0 ? lines : EMPTY_CART;
}

export function readCart(tableToken: string): readonly CartLine[] {
  const cached = snapshots.get(tableToken);
  if (cached) return cached;

  const value =
    typeof window === "undefined"
      ? EMPTY_CART
      : parseStored(window.localStorage.getItem(storageKey(tableToken)));

  snapshots.set(tableToken, value);
  return value;
}

export function writeCart(tableToken: string, lines: readonly CartLine[]) {
  const next = lines.length > 0 ? lines : EMPTY_CART;
  snapshots.set(tableToken, next);

  try {
    if (next.length === 0) {
      window.localStorage.removeItem(storageKey(tableToken));
    } else {
      window.localStorage.setItem(storageKey(tableToken), JSON.stringify(next));
    }
  } catch {
    // Private browsing or a full quota. The cart still works for this visit,
    // which matters more than surviving a reload.
  }

  for (const listener of listeners) listener();
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
