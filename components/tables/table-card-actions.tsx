"use client";

import { CopyIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  deleteTable,
  regenerateTableToken,
  setTableActive,
} from "@/app/dashboard/meja/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";

export function TableCardActions({
  tableId,
  isActive,
  menuUrl,
}: {
  tableId: number;
  isActive: boolean;
  menuUrl: string;
}) {
  const { isPending, run } = useServerActionToast();

  return (
    <div className="flex items-center justify-between gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
      <label className="flex items-center gap-2 text-xs text-zinc-500">
        <Switch
          checked={isActive}
          disabled={isPending}
          onCheckedChange={(checked) =>
            run(() => setTableActive(tableId, checked), {
              errorMessage: "Gagal mengubah status meja.",
            })
          }
        />
        {isActive ? "Aktif" : "Nonaktif"}
      </label>

      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(menuUrl);
              toast.success(`Tautan meja ${tableId} disalin.`);
            } catch {
              toast.error("Gagal menyalin tautan.");
            }
          }}
        >
          <CopyIcon className="text-zinc-500" />
          <span className="sr-only">Salin tautan meja {tableId}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={() => {
            if (
              !window.confirm(
                `Ganti QR meja ${tableId}?\n\nStiker yang sudah tercetak langsung tidak berlaku dan harus dicetak ulang. Pelanggan yang sedang membuka menu meja ini juga kehilangan akses ke halaman pesanannya.\n\nLakukan hanya kalau QR-nya bocor atau nomor mejanya dipakai ulang.`,
              )
            )
              return;
            run(() => regenerateTableToken(tableId), {
              successMessage: `QR meja ${tableId} diganti. Cetak ulang stikernya.`,
              errorMessage: "Gagal mengganti QR.",
              useErrorMessage: true,
            });
          }}
        >
          <RefreshCwIcon className="text-zinc-500" />
          <span className="sr-only">Ganti QR meja {tableId}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm(`Hapus meja ${tableId}?`)) return;
            run(() => deleteTable(tableId), {
              successMessage: `Meja ${tableId} dihapus.`,
              errorMessage: "Gagal menghapus meja.",
              useErrorMessage: true,
            });
          }}
        >
          <Trash2Icon className="text-zinc-500" />
          <span className="sr-only">Hapus meja {tableId}</span>
        </Button>
      </div>
    </div>
  );
}
