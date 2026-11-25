import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
import { formatClock, startOfTodayWita } from "@/lib/utils";
import type { OrderCardData } from "@/components/orders/order-card";
import { OrdersLiveUpdates } from "@/components/orders/orders-live-updates";
import { OrdersBoard } from "@/components/orders/orders-board";

// Staff always need the current board, never a cached one.
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireUser();

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { status: { in: ["DITERIMA", "DIPROSES"] } },
        { status: "SELESAI", updatedAt: { gte: startOfTodayWita() } },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { nameSnapshot: "asc" },
        select: {
          id: true,
          nameSnapshot: true,
          quantity: true,
          note: true,
          options: {
            select: { id: true, groupNameSnapshot: true, nameSnapshot: true },
          },
        },
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
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pesanan Masuk
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            {activeCount === 0
              ? "Tidak ada pesanan aktif saat ini."
              : `${activeCount} pesanan sedang dalam proses.`}
          </p>
        </div>
        <OrdersLiveUpdates />
      </div>

      <OrdersBoard cards={cards} />
    </div>
  );
}
