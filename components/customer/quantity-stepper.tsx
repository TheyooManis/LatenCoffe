"use client";

import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_QUANTITY } from "@/lib/cart";

/**
 * Touch-sized quantity control. Big targets on purpose — this is used one-handed
 * on a phone, at a table, often in low light.
 */
export function QuantityStepper({
  quantity,
  onChange,
  removable = false,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  /** Show a trash icon instead of "−" when decrementing would reach zero. */
  removable?: boolean;
}) {
  const willRemove = removable && quantity <= 1;

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        disabled={!removable && quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        aria-label={willRemove ? "Hapus dari keranjang" : "Kurangi jumlah"}
      >
        {willRemove ? <Trash2Icon /> : <MinusIcon />}
      </Button>

      <span
        className="w-8 text-center text-base font-semibold tabular-nums"
        aria-live="polite"
      >
        {quantity}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => onChange(quantity + 1)}
        aria-label="Tambah jumlah"
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
