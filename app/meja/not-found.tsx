import { QrCodeIcon } from "lucide-react";

export default function TableNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <QrCodeIcon className="size-10 text-zinc-300 dark:text-zinc-700" />
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Meja tidak ditemukan
      </h1>
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        QR ini sudah tidak berlaku. Silakan scan ulang QR yang tertempel di meja
        Anda, atau tanyakan ke kasir.
      </p>
    </div>
  );
}
