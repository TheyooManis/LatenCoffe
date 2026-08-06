"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMenuItem, updateMenuItem } from "@/app/dashboard/menu/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";

type Category = { id: string; name: string };

type MenuItemInput = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
};

export function MenuItemDialog({
  categories,
  item,
  triggerRender,
  children,
}: {
  categories: Category[];
  item?: MenuItemInput;
  triggerRender: React.ReactElement;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useServerActionToast();
  const isEdit = !!item;

  function handleSubmit(formData: FormData) {
    run(
      () =>
        isEdit ? updateMenuItem(item.id, formData) : createMenuItem(formData),
      {
        successMessage: isEdit
          ? "Item menu diperbarui."
          : "Item menu ditambahkan.",
        errorMessage: "Gagal menyimpan item.",
        useErrorMessage: true,
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Ubah Item Menu" : "Tambah Item Menu"}
            </DialogTitle>
            <DialogDescription>
              Data ini akan langsung tampil di menu digital pelanggan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Nama item</Label>
            <Input
              id="name"
              name="name"
              defaultValue={item?.name}
              placeholder="Kopi Susu Gula Aren"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step={500}
                defaultValue={item?.price}
                placeholder="20000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategori</Label>
              <Select
                name="categoryId"
                defaultValue={item?.categoryId ?? categories[0]?.id}
                required
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item?.description ?? ""}
              placeholder="Espresso, susu segar, gula aren"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL gambar (opsional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              defaultValue={item?.imageUrl ?? ""}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="isAvailable" className="font-normal">
              Tersedia untuk dipesan
            </Label>
            <Switch
              id="isAvailable"
              name="isAvailable"
              defaultChecked={item?.isAvailable ?? true}
            />
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
