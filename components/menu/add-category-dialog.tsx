"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/app/dashboard/menu/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useServerActionToast();

  function handleSubmit(formData: FormData) {
    run(() => createCategory(formData), {
      successMessage: "Kategori ditambahkan.",
      errorMessage: "Gagal menambah kategori.",
      useErrorMessage: true,
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PlusIcon />
        Kategori
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
            <DialogDescription>
              Contoh: Kopi, Non-Kopi, Makanan Ringan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="category-name">Nama kategori</Label>
            <Input id="category-name" name="name" placeholder="Kopi" required />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
