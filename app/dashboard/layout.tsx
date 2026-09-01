import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SessionProvider } from "@/components/session-provider";
import { UserMenu } from "@/components/dashboard/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  const isOwner = session.user.role === "OWNER";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <SessionProvider>
    {/* print: the QR sheet is the only thing meant to reach paper. */}
    <div className="min-h-screen bg-zinc-50 print:bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white print:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
                LC
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Laten Coffee
              </span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                Ringkasan
              </Link>
              <Link
                href="/dashboard/orders"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                Pesanan
              </Link>
              {isOwner && (
                <>
                  <Link
                    href="/dashboard/menu"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  >
                    Kelola Menu
                  </Link>
                  <Link
                    href="/dashboard/meja"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  >
                    Meja &amp; QR
                  </Link>
                </>
              )}
            </nav>
          </div>

          <UserMenu
            name={session.user.name}
            email={session.user.email}
            signOutAction={signOutAction}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
    </SessionProvider>
  );
}
