"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElapsedTime } from "@/components/orders/elapsed-time";
import { useServerActionToast } from "@/hooks/use-server-action-toast";
import { advanceOrderStatus, markOrderPaid } from "@/app/dashboard/orders/actions";
import { formatRupiah } from "@/lib/utils";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

export type OrderCardData = {
  id: string;
  queueNumber: number;
  tableId: number;
  status: OrderStatus;
  paymentMethod: "QRIS" | "VIRTUAL_ACCOUNT";
  paymentStatus: "BELUM_BAYAR" | "SUDAH_BAYAR";
  totalAmount: number;
  note: string | null;
  createdAt: string;
  clockLabel: string;
  items: {
    id: string;
    nameSnapshot: string;
    quantity: number;
    note: string | null;
    options: { id: string; groupNameSnapshot: string; nameSnapshot: string }[];
  }[];
};

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  DITERIMA: "Proses pesanan",
  DIPROSES: "Tandai selesai",
};

export function OrderCard({ order }: { order: OrderCardData }) {
  const { isPending, run } = useServerActionToast();
  const isPaid = order.paymentStatus === "SUDAH_BAYAR";
  const nextLabel = NEXT_ACTION_LABEL[order.status];

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Meja {order.tableId}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Antrian #{order.queueNumber} &middot; {order.clockLabel} &middot;{" "}
            <ElapsedTime since={order.createdAt} />
          </p>
        </div>
        <Badge variant={isPaid ? "secondary" : "destructive"}>
          {isPaid ? "Sudah bayar" : "Belum bayar"}
        </Badge>
      </header>

      <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {item.quantity}&times;
            </span>{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              {item.nameSnapshot}
            </span>
            {item.options.length > 0 && (
              <p className="ml-5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {item.options.map((option) => option.nameSnapshot).join(" · ")}
              </p>
            )}
            {item.note && (
              <p className="ml-5 text-xs text-amber-700 dark:text-amber-500">
                {item.note}
              </p>
            )}
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Catatan: {order.note}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
        <span className="text-zinc-500 dark:text-zinc-400">
          {order.paymentMethod === "QRIS" ? "QRIS" : "Virtual Account"}
        </span>
        <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatRupiah(order.totalAmount)}
        </span>
      </div>

      {(nextLabel || !isPaid) && (
        <div className="mt-3 flex flex-col gap-2">
          {!isPaid && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isPending}
              onClick={() =>
                run(() => markOrderPaid(order.id), {
                  successMessage: `Meja ${order.tableId} ditandai sudah bayar.`,
                  errorMessage: "Gagal memperbarui status bayar.",
                  useErrorMessage: true,
                })
              }
            >
              Tandai sudah bayar
            </Button>
          )}
          {nextLabel && (
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={() =>
                run(() => advanceOrderStatus(order.id, order.status), {
                  successMessage: `Meja ${order.tableId} diperbarui.`,
                  errorMessage: "Gagal memperbarui pesanan.",
                  useErrorMessage: true,
                })
              }
            >
              {nextLabel}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
