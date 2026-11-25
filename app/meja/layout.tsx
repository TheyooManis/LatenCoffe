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
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#1A1412]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white/80 shadow-sm transition-all sm:max-w-2xl md:max-w-4xl lg:max-w-6xl dark:bg-[#2C1F1A]/30">
        {children}
      </div>
    </div>
  );
}
