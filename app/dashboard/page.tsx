import Link from "next/link";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const isOwner = session?.user?.role === "OWNER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Selamat datang, {session?.user?.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {session?.user?.email} &middot;{" "}
          {session?.user?.role === "OWNER" ? "Owner" : "Admin"} &middot; Laten
          Coffee Shop
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <Link href="/dashboard/orders" className="block">
          <Card className="h-full transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
            <CardHeader>
              <CardTitle>Pesanan Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Pantau pesanan per meja dan ubah statusnya sampai selesai.
              </p>
            </CardContent>
          </Card>
        </Link>

        {isOwner && (
          <Link href="/dashboard/menu" className="block">
            <Card className="h-full transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <CardHeader>
                <CardTitle>Kelola Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Tambah, ubah, atau nonaktifkan item menu dan kategori.
                </p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
