import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TableCardActions } from "@/components/tables/table-card-actions";
import { TablePageActions } from "@/components/tables/table-page-actions";

// Tokens can be regenerated at any moment; a cached QR would print a dead one.
export const dynamic = "force-dynamic";

/**
 * Origin to encode in the QR codes.
 *
 * Falls back to the request's own host so this works in development without
 * configuration, but set APP_URL before printing for real — stickers made while
 * browsing localhost would point at the owner's laptop.
 */
async function appOrigin() {
  const configured = process.env.APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${protocol}://${host}`;
}

export default async function TablesPage() {
  const session = await auth();
  if (session?.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  const [tables, origin] = await Promise.all([
    prisma.table.findMany({
      orderBy: { id: "asc" },
      select: { id: true, qrToken: true, isActive: true },
    }),
    appOrigin(),
  ]);

  const cards = await Promise.all(
    tables.map(async (table) => {
      const url = `${origin}/meja/${table.qrToken}`;
      return {
        ...table,
        url,
        // Rendered on the server as inline SVG: it prints at any size without
        // blurring, and needs no client-side JavaScript.
        svg: await QRCode.toString(url, {
          type: "svg",
          margin: 0,
          errorCorrectionLevel: "M",
        }),
      };
    }),
  );

  const isLocalOrigin = /localhost|127\.0\.0\.1/.test(origin);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Meja &amp; QR
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Cetak, gunting, lalu tempel di meja masing-masing. Pelanggan scan
            dan langsung masuk ke menu meja itu.
          </p>
        </div>
        <TablePageActions />
      </div>

      {isLocalOrigin && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 print:hidden dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          QR ini menunjuk ke <code>{origin}</code> — hanya bisa dibuka dari
          komputer ini. Sebelum mencetak untuk dipakai di kafe, set{" "}
          <code>APP_URL</code> ke alamat aplikasi yang sudah online.
        </p>
      )}

      {tables.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center print:hidden dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Belum ada meja. Tambah meja dulu untuk membuat QR-nya.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-6">
          {cards.map((table) => (
            <article
              key={table.id}
              className={`space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 print:break-inside-avoid print:border-zinc-400 print:bg-white ${
                // A retired table's sticker should never come out of the printer.
                table.isActive ? "" : "opacity-60 print:hidden"
              }`}
            >
              <div className="text-center">
                <p className="text-xs tracking-wide text-zinc-500 uppercase print:text-zinc-600">
                  Laten Coffee Shop
                </p>
                <p className="text-2xl font-bold text-zinc-900 print:text-black dark:text-zinc-50">
                  Meja {table.id}
                </p>
              </div>

              <div
                className="mx-auto w-40 [&>svg]:h-auto [&>svg]:w-full print:w-44"
                dangerouslySetInnerHTML={{ __html: table.svg }}
              />

              <p className="text-center text-xs text-zinc-500 print:text-zinc-700">
                Scan untuk lihat menu &amp; pesan langsung dari meja
              </p>

              <p className="truncate text-center text-[10px] text-zinc-400 print:hidden">
                {table.url}
              </p>

              <div className="print:hidden">
                <TableCardActions
                  tableId={table.id}
                  isActive={table.isActive}
                  menuUrl={table.url}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
