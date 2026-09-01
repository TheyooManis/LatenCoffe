"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  EMPTY_CART,
  MAX_QUANTITY,
  cartLineKey,
  lineKeyOf,
  readCart,
  subscribeCart,
  writeCart,
  type CartLine,
} from "@/lib/cart";

type UpsertInput = {
  /** Key of the row being edited, if any. Its options may have just changed. */
  replaceKey?: string;
  menuItemId: string;
  optionIds: string[];
  quantity: number;
  note: string | null;
};

export function useCart(tableToken: string) {
  const lines = useSyncExternalStore(
    subscribeCart,
    () => readCart(tableToken),
    // localStorage does not exist while the page is rendered on the server;
    // starting empty keeps the first client paint identical to the server one.
    () => EMPTY_CART,
  );

  const upsertLine = useCallback(
    (input: UpsertInput) => {
      const current = readCart(tableToken);

      const withoutEdited = input.replaceKey
        ? current.filter((line) => lineKeyOf(line) !== input.replaceKey)
        : current;

      if (input.quantity <= 0) {
        writeCart(tableToken, withoutEdited);
        return;
      }

      const optionIds = [...input.optionIds].sort();
      const key = cartLineKey(input.menuItemId, optionIds);
      const line: CartLine = {
        menuItemId: input.menuItemId,
        optionIds,
        quantity: Math.min(input.quantity, MAX_QUANTITY),
        note: input.note?.trim() || null,
      };

      const existing = withoutEdited.findIndex(
        (candidate) => lineKeyOf(candidate) === key,
      );

      const next = [...withoutEdited];
      if (existing >= 0) {
        // Same drink, same options: bump the row instead of adding a second one
        // the barista would read as two separate cups.
        next[existing] = {
          ...line,
          quantity: Math.min(
            next[existing].quantity + line.quantity,
            MAX_QUANTITY,
          ),
        };
      } else {
        next.push(line);
      }

      writeCart(tableToken, next);
    },
    [tableToken],
  );

  const clear = useCallback(() => writeCart(tableToken, []), [tableToken]);

  return { lines, upsertLine, clear };
}
