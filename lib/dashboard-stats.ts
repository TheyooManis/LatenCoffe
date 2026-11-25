import { prisma } from "@/lib/prisma";
import { startOfTodayWita } from "@/lib/utils";

export type DashboardStatsData = {
  kpi: {
    todayRevenue: number;
    todayOrders: number;
    todayAov: number;
    activeOrdersCount: number;
    popularItemName: string;
    popularItemQty: number;
  };
  hourlyTrend: {
    hour: string;
    omzet: number;
    pesanan: number;
  }[];
  sevenDaysTrend: {
    date: string;
    shortDate: string;
    omzet: number;
    pesanan: number;
  }[];
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  paymentBreakdown: {
    name: string;
    value: number;
    count: number;
    color: string;
  }[];
};

export async function getDashboardStats(): Promise<DashboardStatsData> {
  const WITA_OFFSET = 8 * 60 * 60 * 1000;
  const now = new Date();
  const startToday = startOfTodayWita();

  // 7 days ago WITA
  const nowWita = new Date(now.getTime() + WITA_OFFSET);
  const sevenDaysAgoWita = new Date(nowWita.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startSevenDays = new Date(
    Date.UTC(
      sevenDaysAgoWita.getUTCFullYear(),
      sevenDaysAgoWita.getUTCMonth(),
      sevenDaysAgoWita.getUTCDate(),
      0, 0, 0, 0
    ) - WITA_OFFSET
  );

  // 30 days ago for top products
  const thirtyDaysAgoWita = new Date(nowWita.getTime() - 29 * 24 * 60 * 60 * 1000);
  const startThirtyDays = new Date(
    Date.UTC(
      thirtyDaysAgoWita.getUTCFullYear(),
      thirtyDaysAgoWita.getUTCMonth(),
      thirtyDaysAgoWita.getUTCDate(),
      0, 0, 0, 0
    ) - WITA_OFFSET
  );

  const [todayOrders, sevenDaysOrders, thirtyDaysOrders, activeOrdersCount] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          status: "SELESAI",
          updatedAt: { gte: startToday },
        },
        include: {
          items: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: "SELESAI",
          updatedAt: { gte: startSevenDays },
        },
        select: {
          updatedAt: true,
          totalAmount: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: "SELESAI",
          updatedAt: { gte: startThirtyDays },
        },
        include: {
          items: true,
        },
      }),
      prisma.order.count({
        where: {
          status: { in: ["DITERIMA", "DIPROSES"] },
        },
      }),
    ]);

  // 1. KPI Today
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const todayOrdersCount = todayOrders.length;
  const todayAov =
    todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount) : 0;

  // Most popular item today
  const itemQtyMapToday = new Map<string, number>();
  todayOrders.forEach((o) => {
    o.items.forEach((item) => {
      itemQtyMapToday.set(
        item.nameSnapshot,
        (itemQtyMapToday.get(item.nameSnapshot) ?? 0) + item.quantity
      );
    });
  });

  let popularItemName = "-";
  let popularItemQty = 0;
  for (const [name, qty] of itemQtyMapToday.entries()) {
    if (qty > popularItemQty) {
      popularItemName = name;
      popularItemQty = qty;
    }
  }

  // 2. Hourly trend today (08:00 - 23:00)
  const hourlyMap = new Map<number, { omzet: number; pesanan: number }>();
  for (let h = 8; h <= 23; h++) {
    hourlyMap.set(h, { omzet: 0, pesanan: 0 });
  }

  todayOrders.forEach((o) => {
    const orderWita = new Date(o.updatedAt.getTime() + WITA_OFFSET);
    const hour = orderWita.getUTCHours();
    const existing = hourlyMap.get(hour) ?? { omzet: 0, pesanan: 0 };
    hourlyMap.set(hour, {
      omzet: existing.omzet + o.totalAmount,
      pesanan: existing.pesanan + 1,
    });
  });

  const hourlyTrend = Array.from(hourlyMap.entries()).map(([h, data]) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    omzet: data.omzet,
    pesanan: data.pesanan,
  }));

  // 3. 7 Days trend
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const sevenDaysMap = new Map<
    string,
    { date: string; shortDate: string; omzet: number; pesanan: number }
  >();

  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(nowWita.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${dayDate.getUTCFullYear()}-${String(dayDate.getUTCMonth() + 1).padStart(2, "0")}-${String(dayDate.getUTCDate()).padStart(2, "0")}`;
    const dayName = dayNames[dayDate.getUTCDay()];
    const shortDate = `${dayName}, ${dayDate.getUTCDate()} ${dayDate.toLocaleString("id-ID", { month: "short" })}`;
    sevenDaysMap.set(key, {
      date: key,
      shortDate,
      omzet: 0,
      pesanan: 0,
    });
  }

  sevenDaysOrders.forEach((o) => {
    const orderWita = new Date(o.updatedAt.getTime() + WITA_OFFSET);
    const key = `${orderWita.getUTCFullYear()}-${String(orderWita.getUTCMonth() + 1).padStart(2, "0")}-${String(orderWita.getUTCDate()).padStart(2, "0")}`;
    const existing = sevenDaysMap.get(key);
    if (existing) {
      existing.omzet += o.totalAmount;
      existing.pesanan += 1;
    }
  });

  const sevenDaysTrend = Array.from(sevenDaysMap.values());

  // 4. Top 5 Products (from 30 days)
  const productSales = new Map<string, { quantity: number; revenue: number }>();
  thirtyDaysOrders.forEach((o) => {
    o.items.forEach((item) => {
      const existing = productSales.get(item.nameSnapshot) ?? {
        quantity: 0,
        revenue: 0,
      };
      const itemSubtotal = item.priceSnapshot * item.quantity;
      productSales.set(item.nameSnapshot, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + itemSubtotal,
      });
    });
  });

  const topProducts = Array.from(productSales.entries())
    .map(([name, stat]) => ({
      name,
      quantity: stat.quantity,
      revenue: stat.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 5. Payment Breakdown (from 30 days)
  let qrisCount = 0;
  let qrisAmount = 0;
  let vaCount = 0;
  let vaAmount = 0;

  thirtyDaysOrders.forEach((o) => {
    if (o.paymentMethod === "QRIS") {
      qrisCount += 1;
      qrisAmount += o.totalAmount;
    } else {
      vaCount += 1;
      vaAmount += o.totalAmount;
    }
  });

  const paymentBreakdown = [
    {
      name: "QRIS",
      value: qrisAmount,
      count: qrisCount,
      color: "#10B981", // Emerald-500
    },
    {
      name: "Virtual Account",
      value: vaAmount,
      count: vaCount,
      color: "#6366F1", // Indigo-500
    },
  ];

  return {
    kpi: {
      todayRevenue,
      todayOrders: todayOrdersCount,
      todayAov,
      activeOrdersCount,
      popularItemName,
      popularItemQty,
    },
    hourlyTrend,
    sevenDaysTrend,
    topProducts,
    paymentBreakdown,
  };
}
