"use client";

import { useState } from "react";
import { OrderCard, type OrderCardData } from "@/components/orders/order-card";
import type { OrderStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const COLUMNS: {
  status: OrderStatus;
  title: string;
  hint: string;
  colorClass: string;
  badgeClass: string;
}[] = [
  {
    status: "DITERIMA",
    title: "Diterima",
    hint: "Pesanan baru masuk",
    colorClass: "border-amber-400/40 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60",
    badgeClass: "bg-amber-500 text-white",
  },
  {
    status: "DIPROSES",
    title: "Diproses",
    hint: "Sedang dibuat barista",
    colorClass: "border-sky-400/40 bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/60",
    badgeClass: "bg-sky-500 text-white",
  },
  {
    status: "SELESAI",
    title: "Selesai",
    hint: "Hari ini",
    colorClass: "border-emerald-400/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60",
    badgeClass: "bg-emerald-500 text-white",
  },
];

export function OrdersBoard({ cards }: { cards: OrderCardData[] }) {
  const [mobileTab, setMobileTab] = useState<OrderStatus>("DITERIMA");

  const ordersByStatus = {
    DITERIMA: cards.filter((c) => c.status === "DITERIMA"),
    DIPROSES: cards.filter((c) => c.status === "DIPROSES"),
    SELESAI: cards.filter((c) => c.status === "SELESAI"),
  };

  return (
    <div className="space-y-4">
      {/* Mobile Segmented Tab Bar (Hidden on lg: screens) */}
      <div className="lg:hidden">
        <div className="flex rounded-2xl border border-zinc-200/90 bg-zinc-100/90 p-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90">
          {COLUMNS.map((col) => {
            const count = ordersByStatus[col.status].length;
            const isSelected = mobileTab === col.status;
            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setMobileTab(col.status)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 active:scale-95",
                  isSelected
                    ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                <span>{col.title}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                    count > 0 && isSelected
                      ? col.badgeClass
                      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Active Column Cards */}
        <div className="mt-4 space-y-3">
          {ordersByStatus[mobileTab].length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-500">
                Tidak ada pesanan pada status ini
              </p>
            </div>
          ) : (
            ordersByStatus[mobileTab].map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>

      {/* Desktop & Tablet Landscape Kanban View (3 Columns) */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        {COLUMNS.map((column) => {
          const columnOrders = ordersByStatus[column.status];

          return (
            <section key={column.status} className="space-y-3">
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3.5 py-2",
                  column.colorClass,
                )}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold tracking-wider uppercase">
                    {column.title}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                      column.badgeClass,
                    )}
                  >
                    {columnOrders.length}
                  </span>
                </div>
                <span className="text-[11px] opacity-80">{column.hint}</span>
              </div>

              {columnOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300/80 p-8 text-center dark:border-zinc-800">
                  <p className="text-sm text-zinc-400">Tidak ada pesanan</p>
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
