import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, QrCodeIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OrderStatusLive } from "@/components/customer/order-status-live";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatClock, formatRupiah } from "@/lib/utils";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

// The status changes while the customer is looking at this page.
export const dynamic = "force-dynamic";

const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "DITERIMA", label: "Diterima", hint: "Pesanan masuk ke kasir" },
  { status: "DIPROSES", label: "Diproses", hint: "Barista sedang membuat" },
  { status: "SELESAI", label: "Selesai", hint: "Siap diambil / diantar" },
];

/**
 * Simulated VA number (see CLAUDE.md — no real settlement yet). Derived from
 * the order so it is identical on every reload, and unique per day and table.
 */
function virtualAccountNumber(order: {
  tableId: number;
  queueNumber: number;
  createdAt: Date;
}) {
  const wita = new Date(order.createdAt.getTime() + 8 * 60 * 60 * 1000);
  const month = String(wita.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wita.getUTCDate()).padStart(2, "0");
  return `8808${month}${day}${String(order.tableId).padStart(2, "0")}${String(
    order.queueNumber,
  ).padStart(3, "0")}`;
}

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ qrToken: string; orderId: string }>;
}) {
  const { qrToken, orderId } = await params;

  // Scoped to the table's QR token, so knowing an order id alone is not enough
  // to read someone else's order.
  const order = await prisma.order.findFirst({
    where: { id: orderId, table: { qrToken } },
    include: {
      items: {
        orderBy: { nameSnapshot: "asc" },
        select: {
          id: true,
          nameSnapshot: true,
          priceSnapshot: true,
          quantity: true,
          note: true,
          options: {
            select: {
              id: true,
              nameSnapshot: true,
              priceDeltaSnapshot: true,
            },
          },
        },
      },
    },
  });
  if (!order) notFound();

  const currentStep = STEPS.findIndex((step) => step.status === order.status);
  const isPaid = order.paymentStatus === "SUDAH_BAYAR";
  const isDone = order.status === "SELESAI";

  return (
    <div className="flex flex-1 flex-col">
      <OrderStatusLive done={isDone} />

      <header className="border-b border-zinc-200 px-4 py-6 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Nomor antrian Anda</p>
        <p className="mt-1 text-5xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {order.queueNumber}
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Meja {order.tableId} &middot; {formatClock(order.createdAt)}
        </p>
      </header>

      <section className="space-y-4 border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
        <ol className="space-y-3">
          {STEPS.map((step, index) => {
            const reached = index <= currentStep;
            return (
              <li key={step.status} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    reached
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900"
                  }`}
                >
                  {reached ? <CheckIcon className="size-3.5" /> : index + 1}
                </span>
                <div>
                  <p
                    className={
                      reached
                        ? "text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        : "text-sm text-zinc-400"
                    }
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-zinc-500">{step.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Pembayaran
          </h2>
          <Badge variant={isPaid ? "secondary" : "destructive"}>
            {isPaid ? "Sudah bayar" : "Belum bayar"}
          </Badge>
        </div>

        {isPaid ? (
          <p className="mt-3 text-sm text-zinc-500">
            Pembayaran sudah dikonfirmasi kasir. Terima kasih!
          </p>
        ) : order.paymentMethod === "QRIS" ? (
          <div className="mt-3 rounded-lg border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700">
            <QrCodeIcon className="mx-auto size-10 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              Scan QRIS yang tersedia di meja kasir, lalu tunjukkan bukti bayar.
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {formatRupiah(order.totalAmount)}
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Nomor Virtual Account</p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-wider">
              {virtualAccountNumber(order)}
            </p>
            <p className="mt-3 text-xs text-zinc-500">Jumlah transfer</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatRupiah(order.totalAmount)}
            </p>
          </div>
        )}

        {!isPaid && (
          <p className="mt-3 text-xs text-zinc-500">
            Kasir akan menandai pesanan ini lunas setelah pembayaran diterima.
          </p>
        )}
      </section>

      <section className="flex-1 px-4 py-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Rincian pesanan
        </h2>

        <ul className="mt-3 space-y-3">
          {order.items.map((item) => {
            // Snapshots, so this stays the price the customer actually agreed
            // to even after the owner edits the menu.
            const unitPrice =
              item.priceSnapshot +
              item.options.reduce(
                (sum, option) => sum + option.priceDeltaSnapshot,
                0,
              );

            return (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    <span className="font-medium">{item.quantity}&times;</span>{" "}
                    {item.nameSnapshot}
                  </p>
                  {item.options.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {item.options
                        .map((option) => option.nameSnapshot)
                        .join(", ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-xs text-amber-700 dark:text-amber-500">
                      {item.note}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {formatRupiah(unitPrice * item.quantity)}
                </span>
              </li>
            );
          })}
        </ul>

        {order.note && (
          <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Catatan: {order.note}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span className="text-sm text-zinc-500">Total</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>
      </section>

      <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-950">
        <Button
          render={<Link href={`/meja/${qrToken}`} />}
          nativeButton={false}
          variant="outline"
          className="h-12 w-full text-base"
        >
          Pesan lagi
        </Button>
      </div>
    </div>
  );
}
