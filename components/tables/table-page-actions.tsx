"use client";

import { PlusIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTable } from "@/app/dashboard/meja/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";

export function TablePageActions() {
  const { isPending, run } = useServerActionToast();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => window.print()}
      >
        <PrinterIcon />
        Cetak QR
      </Button>

      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          run(() => createTable(), {
            successMessage: "Meja ditambahkan.",
            errorMessage: "Gagal menambah meja.",
            useErrorMessage: true,
          })
        }
      >
        <PlusIcon />
        Tambah Meja
      </Button>
    </div>
  );
}
