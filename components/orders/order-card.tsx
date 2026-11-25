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
    <article className="rounded-2xl border border-zinc-200/90 bg-white p-4.5 shadow-2xs transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/70">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Meja {order.tableId}
            </p>
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              #{order.queueNumber}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {order.clockLabel} &middot; <ElapsedTime since={order.createdAt} />
          </p>
        </div>
        <Badge
          variant={isPaid ? "secondary" : "destructive"}
          className={isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : ""}
        >
          {isPaid ? "Sudah bayar" : "Belum bayar"}
        </Badge>
      </header>

      <ul className="mt-3.5 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
                {item.quantity}&times;
              </span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {item.nameSnapshot}
              </span>
            </div>
            {item.options.length > 0 && (
              <p className="ml-5 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {item.options.map((option) => option.nameSnapshot).join(" · ")}
              </p>
            )}
            {item.note && (
              <p className="ml-5 mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                Catatan: {item.note}
              </p>
            )}
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mt-2.5 rounded-xl bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Pesanan: {order.note}
        </p>
      )}

      <div className="mt-3.5 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800/80">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {order.paymentMethod === "QRIS" ? "QRIS" : "Virtual Account"}
        </span>
        <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatRupiah(order.totalAmount)}
        </span>
      </div>

      {(nextLabel || !isPaid) && (
        <div className="mt-3.5 flex flex-col gap-2">
          {!isPaid && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isPending}
              className="min-h-[44px] w-full rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
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
              className={
                order.status === "DITERIMA"
                  ? "min-h-[46px] w-full rounded-xl bg-sky-600 font-semibold text-white shadow-xs hover:bg-sky-500 active:scale-[0.98]"
                  : "min-h-[46px] w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-xs hover:bg-emerald-500 active:scale-[0.98]"
              }
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
