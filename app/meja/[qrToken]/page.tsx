import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MenuBrowser } from "@/components/customer/menu-browser";
import type { MenuCategory } from "@/components/customer/menu-browser";

// The owner flips availability from the dashboard; a cached menu would let
// customers order what the bar just ran out of.
export const dynamic = "force-dynamic";

export default async function TableMenuPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;

  // The URL carries the token, never the table number, so nobody can order for
  // another table by editing the address bar.
  const table = await prisma.table.findUnique({
    where: { qrToken },
    select: { id: true, isActive: true },
  });
  if (!table?.isActive) notFound();

  const [categories, activeOrders] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        menuItems: {
          where: { isAvailable: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            optionGroups: {
              orderBy: [{ order: "asc" }, { name: "asc" }],
              select: {
                id: true,
                name: true,
                isRequired: true,
                maxSelect: true,
                options: {
                  // Sold-out choices are hidden rather than shown disabled, so
                  // the customer never taps something that cannot be made.
                  where: { isAvailable: true },
                  orderBy: [{ order: "asc" }, { name: "asc" }],
                  select: { id: true, name: true, priceDelta: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { tableId: table.id, status: { in: ["DITERIMA", "DIPROSES"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, queueNumber: true, status: true },
    }),
  ]);

  const menu: MenuCategory[] = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      // An item whose required question has no answers left cannot be made at
      // all, so it is hidden rather than shown as an unorderable dead end.
      items: category.menuItems.filter((item) =>
        item.optionGroups.every(
          (group) => !group.isRequired || group.options.length > 0,
        ),
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <>
      {activeOrders.length > 0 && (
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          {activeOrders.map((order) => (
            <Link
              key={order.id}
              href={`/meja/${qrToken}/pesanan/${order.id}`}
              className="flex items-center justify-between py-1 text-sm"
            >
              <span className="text-zinc-700 dark:text-zinc-300">
                Antrian #{order.queueNumber} &middot;{" "}
                {order.status === "DITERIMA" ? "Diterima" : "Sedang dibuat"}
              </span>
              <span className="flex items-center gap-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                Lihat
                <ChevronRightIcon className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <MenuBrowser tableToken={qrToken} tableId={table.id} categories={menu} />
    </>
  );
}
