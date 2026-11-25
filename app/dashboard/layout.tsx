import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SessionProvider } from "@/components/session-provider";
import { UserMenu } from "@/components/dashboard/user-menu";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

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
    <div className="min-h-screen bg-[#FBF9F5]/70 print:bg-white dark:bg-[#1A1412]">
      <header className="sticky top-0 z-30 border-b border-amber-900/10 bg-white/90 backdrop-blur-md print:hidden dark:border-amber-950/40 dark:bg-[#2C1F1A]/90">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2C1F1A] text-xs font-bold text-[#FBF9F5] shadow-xs ring-1 ring-[#C87D43]/40 dark:bg-[#C87D43] dark:text-[#1A1412]">
                LC
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-[#1A1412] dark:text-[#FBF9F5]">
                  Laten Coffee
                </span>
                <span className="rounded-md bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-900 uppercase dark:bg-amber-950/60 dark:text-amber-300">
                  {isOwner ? "Owner" : "Kasir"}
                </span>
              </div>
            </Link>

            <DashboardNav isOwner={isOwner} />
          </div>

          <div className="flex items-center gap-2">
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              signOutAction={signOutAction}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-24 sm:px-6 sm:py-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
    </SessionProvider>
  );
}
