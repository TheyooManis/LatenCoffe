"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { QuantityStepper } from "@/components/customer/quantity-stepper";
import { formatRupiah } from "@/lib/utils";
import type { CartLine } from "@/lib/cart";
import type {
  MenuItemView,
  MenuOptionGroupView,
} from "@/components/customer/menu-browser";

/** Bottom sheet on phones, a normal centered dialog from `sm` up. */
const SHEET_CLASSES =
  "top-auto bottom-0 max-h-[85vh] max-w-full translate-y-0 overflow-y-auto rounded-b-none sm:top-1/2 sm:bottom-auto sm:max-w-sm sm:-translate-y-1/2 sm:rounded-b-xl";

function formatDelta(priceDelta: number) {
  if (priceDelta === 0) return null;
  const sign = priceDelta > 0 ? "+" : "−";
  return `${sign}${formatRupiah(Math.abs(priceDelta))}`;
}

function groupHint(group: MenuOptionGroupView) {
  if (group.maxSelect <= 1) return group.isRequired ? "Wajib, pilih satu" : "Pilih satu";
  return group.isRequired
    ? `Wajib, maks ${group.maxSelect}`
    : `Boleh pilih sampai ${group.maxSelect}`;
}

export function ItemDialog({
  item,
  line,
  onClose,
  onSubmit,
}: {
  item: MenuItemView | null;
  /** The cart row being edited, or null when adding fresh. */
  line: CartLine | null;
  onClose: () => void;
  onSubmit: (
    optionIds: string[],
    quantity: number,
    note: string | null,
  ) => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={SHEET_CLASSES}>
        {item && (
          // Remount per item (and per edited row) so the form never carries
          // over the previous one's choices.
          <ItemForm
            key={`${item.id}:${line?.optionIds.join(",") ?? "new"}`}
            item={item}
            line={line}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function initialSelection(item: MenuItemView, line: CartLine | null) {
  const chosen = new Set(line?.optionIds ?? []);
  const selection: Record<string, string[]> = {};

  for (const group of item.optionGroups) {
    const fromCart = group.options
      .filter((option) => chosen.has(option.id))
      .map((option) => option.id);

    if (fromCart.length > 0 || line) {
      selection[group.id] = fromCart;
      continue;
    }

    // Fresh item: pre-answer required single-choice questions with the first
    // (cheapest-listed) option so the common order is one tap.
    selection[group.id] =
      group.isRequired && group.maxSelect <= 1 && group.options[0]
        ? [group.options[0].id]
        : [];
  }

  return selection;
}

function ItemForm({
  item,
  line,
  onSubmit,
}: {
  item: MenuItemView;
  line: CartLine | null;
  onSubmit: (
    optionIds: string[],
    quantity: number,
    note: string | null,
  ) => void;
}) {
  const [selection, setSelection] = useState(() => initialSelection(item, line));
  const [quantity, setQuantity] = useState(line?.quantity ?? 1);
  const [note, setNote] = useState(line?.note ?? "");
  const isEditing = line !== null;

  const optionIds = item.optionGroups.flatMap((group) => selection[group.id] ?? []);
  const deltas = item.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => (selection[group.id] ?? []).includes(option.id))
      .map((option) => option.priceDelta),
  );
  const unitPrice = item.price + deltas.reduce((sum, delta) => sum + delta, 0);

  function toggle(group: MenuOptionGroupView, optionId: string, on: boolean) {
    setSelection((current) => {
      const previous = current[group.id] ?? [];
      if (!on) {
        return { ...current, [group.id]: previous.filter((id) => id !== optionId) };
      }
      if (previous.length >= group.maxSelect) return current;
      return { ...current, [group.id]: [...previous, optionId] };
    });
  }

  function handleSubmit() {
    const missing = item.optionGroups.find(
      (group) => group.isRequired && (selection[group.id] ?? []).length === 0,
    );
    if (missing) {
      toast.error(`${missing.name} wajib dipilih.`);
      return;
    }
    onSubmit(optionIds, quantity, note.trim() || null);
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="pr-8 text-lg">{item.name}</DialogTitle>
        {item.description && (
          <DialogDescription>{item.description}</DialogDescription>
        )}
      </DialogHeader>

      <p className="text-base font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
        {formatRupiah(item.price)}
      </p>

      {item.optionGroups.map((group) => {
        const selected = selection[group.id] ?? [];
        const atCap = selected.length >= group.maxSelect;

        return (
          <fieldset key={group.id} className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <legend className="sr-only">{group.name}</legend>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {group.name}
              </span>
              <span className="text-xs text-zinc-500">{groupHint(group)}</span>
            </div>

            {group.maxSelect <= 1 ? (
              <RadioGroup
                value={selected[0] ?? null}
                onValueChange={(value) =>
                  setSelection((current) => ({
                    ...current,
                    [group.id]: typeof value === "string" ? [value] : [],
                  }))
                }
              >
                {group.options.map((option) => (
                  <Label
                    key={option.id}
                    className="flex items-center justify-between gap-3 py-1.5 font-normal"
                  >
                    <span className="flex items-center gap-2.5">
                      <RadioGroupItem value={option.id} />
                      {option.name}
                    </span>
                    {formatDelta(option.priceDelta) && (
                      <span className="text-sm text-zinc-500 tabular-nums">
                        {formatDelta(option.priceDelta)}
                      </span>
                    )}
                  </Label>
                ))}
              </RadioGroup>
            ) : (
              <div className="grid gap-2">
                {group.options.map((option) => {
                  const checked = selected.includes(option.id);
                  return (
                    <Label
                      key={option.id}
                      className="flex items-center justify-between gap-3 py-1.5 font-normal"
                    >
                      <span className="flex items-center gap-2.5">
                        <Checkbox
                          checked={checked}
                          // At the cap, the remaining boxes go dead rather than
                          // silently ignoring the tap.
                          disabled={!checked && atCap}
                          onCheckedChange={(next) => toggle(group, option.id, next)}
                        />
                        {option.name}
                      </span>
                      {formatDelta(option.priceDelta) && (
                        <span className="text-sm text-zinc-500 tabular-nums">
                          {formatDelta(option.priceDelta)}
                        </span>
                      )}
                    </Label>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}

      <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Label htmlFor="item-note">Catatan (opsional)</Label>
        <Textarea
          id="item-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={120}
          rows={2}
          placeholder="Contoh: less sugar, tanpa es, panas"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <QuantityStepper quantity={quantity} onChange={setQuantity} />

        <Button
          type="button"
          className="h-11 flex-1 text-base"
          onClick={handleSubmit}
        >
          {isEditing ? "Perbarui" : "Tambah"} &middot;{" "}
          {formatRupiah(unitPrice * quantity)}
        </Button>
      </div>

      {isEditing && (
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full text-destructive"
          onClick={() => onSubmit(optionIds, 0, null)}
        >
          Hapus dari keranjang
        </Button>
      )}
    </div>
  );
}
