"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Coffee,
  Coins,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import type { DashboardStatsData } from "@/lib/dashboard-stats";

type Props = {
  initialData: DashboardStatsData;
};

export function SalesAnalyticsClient({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<DashboardStatsData>(initialData);
  const [trendView, setTrendView] = useState<"hourly" | "daily">("hourly");

  // Keep state synced if props change
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Real-time synchronization via SSE
  useEffect(() => {
    const source = new EventSource("/api/orders/stream");

    source.addEventListener("order-changed", () => {
      // Re-fetch fresh server component data
      router.refresh();
    });

    return () => source.close();
  }, [router]);

  const activeTrendData =
    trendView === "hourly"
      ? data.hourlyTrend.map((d) => ({
          name: d.hour,
          omzet: d.omzet,
          pesanan: d.pesanan,
        }))
      : data.sevenDaysTrend.map((d) => ({
          name: d.shortDate,
          omzet: d.omzet,
          pesanan: d.pesanan,
        }));

  const totalPaymentValue = data.paymentBreakdown.reduce(
    (sum, p) => sum + p.value,
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. KPI SUMMARY CARDS (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Omzet Hari Ini */}
        <Card className="rounded-2xl border-zinc-200/90 bg-white p-3.5 shadow-2xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <CardTitle className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase sm:text-xs dark:text-zinc-400">
              Omzet Hari Ini
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="size-3.5 sm:size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-base font-bold tabular-nums text-zinc-900 sm:text-2xl dark:text-zinc-50">
              {formatRupiah(data.kpi.todayRevenue)}
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500 sm:text-xs">
              <Zap className="size-3 shrink-0 text-emerald-500" />
              <span className="truncate">Live WITA</span>
            </p>
          </CardContent>
        </Card>

        {/* Pesanan Hari Ini */}
        <Card className="rounded-2xl border-zinc-200/90 bg-white p-3.5 shadow-2xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <CardTitle className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase sm:text-xs dark:text-zinc-400">
              Pesanan
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="size-3.5 sm:size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-base font-bold tabular-nums text-zinc-900 sm:text-2xl dark:text-zinc-50">
              {data.kpi.todayOrders} <span className="text-xs font-normal text-zinc-500">order</span>
            </div>
            <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">
              {data.kpi.activeOrdersCount > 0 ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {data.kpi.activeOrdersCount} aktif
                </span>
              ) : (
                "Semua selesai"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Nilai Rata-rata per Pesanan (AOV) */}
        <Card className="rounded-2xl border-zinc-200/90 bg-white p-3.5 shadow-2xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <CardTitle className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase sm:text-xs dark:text-zinc-400">
              Rata-rata Order
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="size-3.5 sm:size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-base font-bold tabular-nums text-zinc-900 sm:text-2xl dark:text-zinc-50">
              {formatRupiah(data.kpi.todayAov)}
            </div>
            <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">
              Nilai per transaksi
            </p>
          </CardContent>
        </Card>

        {/* Menu Terlaris Hari Ini */}
        <Card className="rounded-2xl border-zinc-200/90 bg-white p-3.5 shadow-2xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <CardTitle className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase sm:text-xs dark:text-zinc-400">
              Terlaris Hari Ini
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Coffee className="size-3.5 sm:size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="truncate text-base font-bold text-zinc-900 sm:text-xl dark:text-zinc-50" title={data.kpi.popularItemName}>
              {data.kpi.popularItemName}
            </div>
            <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">
              {data.kpi.popularItemQty > 0
                ? `${data.kpi.popularItemQty} cup terjual`
                : "Belum ada transaksi"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. MAIN CHART: TREN PENJUALAN */}
      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Tren Omzet Penjualan
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {trendView === "hourly"
                ? "Fluktuasi penjualan jam-ke-jam hari ini (WITA)"
                : "Akumulasi penjualan 7 hari terakhir"}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
            <Button
              variant={trendView === "hourly" ? "default" : "ghost"}
              size="xs"
              onClick={() => setTrendView("hourly")}
              className="text-xs"
            >
              Hari Ini (Jam)
            </Button>
            <Button
              variant={trendView === "daily" ? "default" : "ghost"}
              size="xs"
              onClick={() => setTrendView("daily")}
              className="text-xs"
            >
              7 Hari Terakhir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeTrendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#E4E4E7" }}
                />
                <YAxis
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}jt`
                      : val >= 1000
                        ? `${val / 1000}rb`
                        : `${val}`
                  }
                />
                <Tooltip
                  formatter={(value: unknown) => [
                    formatRupiah(Number(value) || 0),
                    "Omzet",
                  ]}
                  contentStyle={{
                    backgroundColor: "#18181B",
                    borderRadius: "8px",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#FDE68A" }}
                />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOmzet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. ROW 2: TOP 5 PRODUCTS & PAYMENT METHODS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top 5 Products Bar Chart (2 Cols) */}
        <Card className="border-zinc-200 bg-white lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Top 5 Menu Terlaris (30 Hari)
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Menu yang paling sering dipesan oleh pelanggan.
            </p>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-zinc-400">
                Belum ada data penjualan produk.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#71717A" fontSize={11} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#71717A"
                      fontSize={11}
                      width={120}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        `${value} porsi`,
                        name === "quantity" ? "Terjual" : String(name),
                      ]}
                      contentStyle={{
                        backgroundColor: "#18181B",
                        borderRadius: "8px",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="quantity"
                      fill="#B45309"
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Donut Chart (1 Col) */}
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Metode Pembayaran
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Perbandingan QRIS vs Virtual Account
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {totalPaymentValue === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-zinc-400">
                Belum ada transaksi pembayaran.
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.paymentBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => [
                          formatRupiah(Number(val) || 0),
                          "Nominal",
                        ]}
                        contentStyle={{
                          backgroundColor: "#18181B",
                          borderRadius: "8px",
                          border: "none",
                          color: "#FFFFFF",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 w-full space-y-2">
                  {data.paymentBreakdown.map((item) => {
                    const percentage =
                      totalPaymentValue > 0
                        ? Math.round((item.value / totalPaymentValue) * 100)
                        : 0;

                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {item.name} ({item.count})
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {percentage}% &middot; {formatRupiah(item.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
