import Link from "next/link";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportSalesDialog } from "@/components/dashboard/export-sales-dialog";
import { SalesAnalyticsClient } from "@/components/dashboard/sales-analytics-client";
import { getDashboardStats } from "@/lib/dashboard-stats";

export default async function DashboardPage() {
  const session = await auth();
  const isOwner = session?.user?.role === "OWNER";

  const statsData = isOwner ? await getDashboardStats() : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Selamat datang, {session?.user?.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {session?.user?.email} &middot;{" "}
            {isOwner ? "Owner" : "Admin / Kasir"} &middot; Laten Coffee Shop
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <ExportSalesDialog />
          </div>
        )}
      </div>

      {/* Visual Analytics for Owner */}
      {isOwner && statsData && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Ringkasan &amp; Statistik Penjualan
            </h2>
            <span className="text-xs text-zinc-400">
              Sinkronisasi live via Server-Sent Events
            </span>
          </div>
          <SalesAnalyticsClient initialData={statsData} />
        </section>
      )}

      {/* Quick Navigation Cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Menu Navigasi Cepat
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/orders" className="block">
            <Card className="h-full transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <CardHeader>
                <CardTitle className="text-base">Pesanan Masuk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Pantau pesanan live per meja dan ubah statusnya sampai selesai.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/menu" className="block">
            <Card className="h-full transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <CardHeader>
                <CardTitle className="text-base">Kelola Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isOwner
                    ? "Tambah, ubah, atau atur harga item menu, kategori, dan pilihan ukuran/topping."
                    : "Pantau ketersediaan stok menu dan topping yang sedang habis."}
                </p>
              </CardContent>
            </Card>
          </Link>

          {isOwner && (
            <Link href="/dashboard/meja" className="block">
              <Card className="h-full transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-base">Meja &amp; QR</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Cetak QR untuk ditempel di tiap meja, tambah meja, atau ganti QR yang bocor.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
