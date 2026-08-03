import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-100 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Masuk sebagai
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {session?.user?.name}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {session?.user?.email} &middot; {session?.user?.role}
        </p>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="outline" className="w-full">
            Keluar
          </Button>
        </form>
      </div>
    </div>
  );
}
