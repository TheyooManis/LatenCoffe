"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMenuItem } from "@/app/dashboard/menu/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";

export function DeleteMenuItemButton({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const { isPending, run } = useServerActionToast();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(`Hapus "${itemName}" dari menu?`)) return;
        run(() => deleteMenuItem(itemId), {
          successMessage: "Item menu dihapus.",
          errorMessage: "Gagal menghapus item.",
        });
      }}
    >
      <Trash2Icon className="text-zinc-500" />
      <span className="sr-only">Hapus {itemName}</span>
    </Button>
  );
}
