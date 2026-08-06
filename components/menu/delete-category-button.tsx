"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/app/dashboard/menu/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  disabled,
}: {
  categoryId: string;
  categoryName: string;
  disabled?: boolean;
}) {
  const { isPending, run } = useServerActionToast();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isPending || disabled}
      title={
        disabled
          ? "Pindahkan atau hapus item di kategori ini dulu"
          : `Hapus kategori ${categoryName}`
      }
      onClick={() => {
        if (!window.confirm(`Hapus kategori "${categoryName}"?`)) return;
        run(() => deleteCategory(categoryId), {
          successMessage: "Kategori dihapus.",
          errorMessage: "Gagal menghapus kategori.",
          useErrorMessage: true,
        });
      }}
    >
      <Trash2Icon className="text-zinc-400" />
      <span className="sr-only">Hapus kategori {categoryName}</span>
    </Button>
  );
}
