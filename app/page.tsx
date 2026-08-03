import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-zinc-900 lg:grid-cols-2">
        {/* Left: login form */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-10 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
              LC
            </div>

            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Masuk ke akun Anda
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Dashboard admin &amp; owner Laten Coffee Shop
            </p>

            <LoginForm />
          </div>
        </div>

        {/* Right: decorative panel, hidden on small screens */}
        <div className="relative hidden overflow-hidden bg-blue-900 lg:block">
          <div className="absolute inset-0">
            <div className="absolute left-8 top-8 grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-rose-300/70" />
              ))}
            </div>
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-rose-400/90" />
            <div className="absolute right-16 top-24 h-0 w-0 border-x-[70px] border-b-[110px] border-x-transparent border-b-rose-200/90" />
            <div className="absolute right-24 top-1/2 h-40 w-40 -translate-y-1/2 rotate-45 bg-blue-700" />
            <div className="absolute bottom-24 right-10 grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
