import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
import { formatClock } from "@/lib/utils";
import { OrderCard, type OrderCardData } from "@/components/orders/order-card";
import { OrdersLiveUpdates } from "@/components/orders/orders-live-updates";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

// Staff always need the current board, never a cached one.
export const dynamic = "force-dynamic";

const COLUMNS: { status: OrderStatus; title: string; hint: string }[] = [
  { status: "DITERIMA", title: "Diterima", hint: "Pesanan baru masuk" },
  { status: "DIPROSES", title: "Diproses", hint: "Sedang dibuat" },
  { status: "SELESAI", title: "Selesai", hint: "Hari ini" },
];

/** Start of today in WITA (UTC+8), so "Selesai" only shows today's orders. */
function startOfTodayWita() {
  const nowWita = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const midnightWita = Date.UTC(
    nowWita.getUTCFullYear(),
    nowWita.getUTCMonth(),
    nowWita.getUTCDate(),
  );
  return new Date(midnightWita - 8 * 60 * 60 * 1000);
}

export default async function OrdersPage() {
  await requireUser();

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { status: { in: ["DITERIMA", "DIPROSES"] } },
        { status: "SELESAI", createdAt: { gte: startOfTodayWita() } },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { nameSnapshot: "asc" },
        select: { id: true, nameSnapshot: true, quantity: true, note: true },
      },
    },
  });

  const cards: OrderCardData[] = orders.map((order) => ({
    id: order.id,
    queueNumber: order.queueNumber,
    tableId: order.tableId,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    note: order.note,
    createdAt: order.createdAt.toISOString(),
    clockLabel: formatClock(order.createdAt),
    items: order.items,
  }));

  const activeCount = cards.filter((c) => c.status !== "SELESAI").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Pesanan Masuk
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {activeCount === 0
              ? "Tidak ada pesanan aktif."
              : `${activeCount} pesanan aktif.`}
          </p>
        </div>
        <OrdersLiveUpdates />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnOrders = cards.filter((c) => c.status === column.status);

          return (
            <section key={column.status} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
                  {column.title}
                </h2>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {columnOrders.length > 0 ? columnOrders.length : column.hint}
                </span>
              </div>

              {columnOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                  <p className="text-sm text-zinc-400">Kosong</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {columnOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
