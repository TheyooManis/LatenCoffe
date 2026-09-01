"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import { ImageUploadField } from "@/components/menu/image-upload-field";
import {
  createMenuItem,
  deleteMenuImage,
  updateMenuItem,
} from "@/app/dashboard/menu/actions";
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
  const [imageUrl, setImageUrl] = useState<string | null>(item?.imageUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  // Objects uploaded during this dialog session that nothing points at yet.
  const uploadedRef = useRef<string[]>([]);
  const { isPending, run } = useServerActionToast();
  const isEdit = !!item;

  // Base UI's Select.Value renders the raw value unless Root knows the labels,
  // which is why an unlabelled trigger showed the category id.
  const categoryItems = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories],
  );

  const rememberUpload = useCallback((url: string) => {
    uploadedRef.current.push(url);
  }, []);

  /** Deletes every image uploaded this session except `keep`. */
  function discardUploads(keep: string | null) {
    const orphans = uploadedRef.current.filter((url) => url !== keep);
    uploadedRef.current = [];
    for (const url of orphans) {
      void deleteMenuImage(url).catch(() => {
        // Nothing useful to tell the owner here — the item saved fine, only a
        // stray file is left behind.
      });
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Closed without saving: whatever was uploaded is unreferenced.
      discardUploads(null);
      setImageUrl(item?.imageUrl ?? null);
    }
    setOpen(next);
  }

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
        onSuccess: () => {
          discardUploads(imageUrl);
          const previous = item?.imageUrl ?? null;
          if (previous && previous !== imageUrl) {
            void deleteMenuImage(previous).catch(() => {});
          }
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                items={categoryItems}
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

          <ImageUploadField
            name="imageUrl"
            value={imageUrl}
            onChange={setImageUrl}
            onUploaded={rememberUpload}
            onUploadingChange={setIsUploading}
          />

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
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending
                ? "Menyimpan..."
                : isUploading
                  ? "Menunggu unggahan..."
                  : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
