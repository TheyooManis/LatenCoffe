"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, LandmarkIcon, QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuantityStepper } from "@/components/customer/quantity-stepper";
import { createOrder } from "@/app/meja/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";
import { formatRupiah, cn } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/generated/prisma/enums";
import type { CartEntry } from "@/components/customer/menu-browser";

const SHEET_CLASSES =
  "top-auto bottom-0 max-h-[85vh] max-w-full translate-y-0 grid-rows-[auto_1fr_auto] overflow-y-auto rounded-b-none sm:top-1/2 sm:bottom-auto sm:max-w-md sm:-translate-y-1/2 sm:rounded-b-xl";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  hint: string;
  Icon: typeof QrCodeIcon;
}[] = [
  { value: "QRIS", label: "QRIS", hint: "Scan dari e-wallet", Icon: QrCodeIcon },
  {
    value: "VIRTUAL_ACCOUNT",
    label: "Virtual Account",
    hint: "Transfer bank",
    Icon: LandmarkIcon,
  },
];

export function CartDialog({
  open,
  onOpenChange,
  tableToken,
  tableId,
  entries,
  onChangeQuantity,
  onEditEntry,
  onOrdered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableToken: string;
  tableId: number;
  entries: CartEntry[];
  onChangeQuantity: (entry: CartEntry, quantity: number) => void;
  onEditEntry: (entry: CartEntry) => void;
  onOrdered: () => void;
}) {
  const router = useRouter();
  const { isPending, run } = useServerActionToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [note, setNote] = useState("");

  const totalAmount = entries.reduce(
    (sum, entry) => sum + entry.unitPrice * entry.quantity,
    0,
  );

  function handleSubmit() {
    if (!paymentMethod) return;

    run(
      () =>
        createOrder({
          qrToken: tableToken,
          // Only ids and quantities travel to the server; it prices the order
          // itself from the database.
          lines: entries.map((entry) => ({
            menuItemId: entry.item.id,
            optionIds: entry.options.map((option) => option.id),
            quantity: entry.quantity,
            note: entry.note,
          })),
          note: note.trim() || null,
          paymentMethod,
        }),
      {
        errorMessage: "Gagal mengirim pesanan. Coba lagi.",
        useErrorMessage: true,
        onSuccess: ({ orderId }) => {
          onOrdered();
          router.push(`/meja/${tableToken}/pesanan/${orderId}`);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET_CLASSES}>
        <DialogHeader>
          <DialogTitle className="text-lg">Keranjang</DialogTitle>
          <DialogDescription>
            Pesanan akan dikirim ke kasir untuk meja {tableId}.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            Keranjang masih kosong.
          </p>
        ) : (
          <div className="space-y-4">
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {entries.map((entry) => (
                <li
                  key={entry.key}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => onEditEntry(entry)}
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {entry.item.name}
                    </p>
                    {entry.options.length > 0 && (
                      <p className="text-xs text-zinc-500">
                        {entry.options.map((option) => option.name).join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-zinc-500 tabular-nums">
                      {formatRupiah(entry.unitPrice * entry.quantity)}
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">
                        {entry.note}
                      </p>
                    )}
                  </button>

                  <QuantityStepper
                    quantity={entry.quantity}
                    removable
                    onChange={(quantity) => onChangeQuantity(entry, quantity)}
                  />
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <Label htmlFor="order-note">Catatan untuk kasir (opsional)</Label>
              <Textarea
                id="order-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={200}
                rows={2}
                placeholder="Contoh: sendok tambahan, antar setelah makanan"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Metode pembayaran</legend>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map(({ value, label, hint, Icon }) => {
                  const selected = paymentMethod === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPaymentMethod(value)}
                      className={cn(
                        "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                        selected
                          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                      )}
                    >
                      {selected && (
                        <CheckIcon className="absolute top-2 right-2 size-4" />
                      )}
                      <Icon className="size-5 text-zinc-500" />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-zinc-500">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <span className="text-sm text-zinc-500">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <Button
              type="button"
              className="h-12 w-full text-base"
              disabled={isPending || !paymentMethod}
              onClick={handleSubmit}
            >
              {isPending
                ? "Mengirim pesanan..."
                : paymentMethod
                  ? "Pesan sekarang"
                  : "Pilih metode pembayaran"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
