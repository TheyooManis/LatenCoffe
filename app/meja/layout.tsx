import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Laten Coffee Shop",
  description: "Pesan langsung dari meja Anda.",
};

/**
 * Customer shell. Deliberately mobile-first and capped at a phone-ish width:
 * every visitor arrives by scanning a QR code at the table.
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-white shadow-sm dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
