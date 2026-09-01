"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  createOption,
  createOptionGroup,
  deleteOption,
  deleteOptionGroup,
  setOptionAvailability,
  updateOption,
  updateOptionGroup,
} from "@/app/dashboard/menu/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";
import { formatRupiah } from "@/lib/utils";

export type OptionView = {
  id: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
};

export type OptionGroupView = {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: OptionView[];
};

export function OptionGroupsDialog({
  itemId,
  itemName,
  groups,
  triggerRender,
  children,
}: {
  itemId: string;
  itemName: string;
  groups: OptionGroupView[];
  triggerRender: React.ReactElement;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { isPending, run } = useServerActionToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender}>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pilihan — {itemName}</DialogTitle>
          <DialogDescription>
            Pertanyaan yang harus dijawab pelanggan sebelum memesan item ini,
            misalnya ukuran atau topping.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Belum ada pilihan. Item ini langsung bisa dipesan apa adanya.
            </p>
          ) : (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isPending={isPending}
                run={run}
              />
            ))
          )}

          <Separator />

          <form
            action={(formData) =>
              run(() => createOptionGroup(itemId, formData), {
                successMessage: "Grup pilihan ditambahkan.",
                errorMessage: "Gagal menambah grup pilihan.",
                useErrorMessage: true,
              })
            }
            className="space-y-3 rounded-lg border border-border p-3"
          >
            <p className="text-sm font-medium">Tambah grup pilihan</p>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input name="name" placeholder="Ukuran" required />
              <Input
                name="maxSelect"
                type="number"
                min={1}
                max={20}
                defaultValue={1}
                className="w-20"
                aria-label="Maksimal pilihan"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label className="font-normal">Wajib dipilih</Label>
              <Switch name="isRequired" />
            </div>

            <p className="text-xs text-muted-foreground">
              Angka di sebelah nama adalah maksimal pilihan. Isi 1 untuk
              &quot;pilih satu&quot; seperti Ukuran, lebih dari 1 untuk
              &quot;boleh pilih beberapa&quot; seperti Topping.
            </p>

            <Button type="submit" size="sm" disabled={isPending}>
              <PlusIcon />
              Tambah grup
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Run = ReturnType<typeof useServerActionToast>["run"];

function GroupCard({
  group,
  isPending,
  run,
}: {
  group: OptionGroupView;
  isPending: boolean;
  run: Run;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-border p-3">
      <form
        action={(formData) =>
          run(() => updateOptionGroup(group.id, formData), {
            successMessage: "Grup pilihan diperbarui.",
            errorMessage: "Gagal memperbarui grup.",
            useErrorMessage: true,
          })
        }
        className="space-y-3"
      >
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
          <Input name="name" defaultValue={group.name} required />
          <Input
            name="maxSelect"
            type="number"
            min={1}
            max={20}
            defaultValue={group.maxSelect}
            className="w-20"
            aria-label={`Maksimal pilihan untuk ${group.name}`}
          />
          <Button type="submit" variant="outline" size="icon" disabled={isPending}>
            <CheckIcon />
            <span className="sr-only">Simpan {group.name}</span>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label className="font-normal">Wajib dipilih</Label>
          <Switch name="isRequired" defaultChecked={group.isRequired} />
        </div>
      </form>

      <div className="space-y-1.5">
        {group.options.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Belum ada opsi di grup ini.
            {group.isRequired &&
              " Selama kosong, item ini disembunyikan dari menu pelanggan."}
          </p>
        )}

        {group.options.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <form
              action={(formData) =>
                run(() => updateOption(option.id, formData), {
                  successMessage: "Opsi diperbarui.",
                  errorMessage: "Gagal memperbarui opsi.",
                  useErrorMessage: true,
                })
              }
              className="grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-2"
            >
              <Input name="name" defaultValue={option.name} required />
              <Input
                name="priceDelta"
                type="number"
                step={500}
                defaultValue={option.priceDelta}
                className="w-24"
                aria-label={`Tambahan harga ${option.name}`}
              />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={isPending}
              >
                <CheckIcon />
                <span className="sr-only">Simpan {option.name}</span>
              </Button>
            </form>

            <Switch
              checked={option.isAvailable}
              disabled={isPending}
              aria-label={`${option.name} tersedia`}
              onCheckedChange={(checked) =>
                run(() => setOptionAvailability(option.id, checked), {
                  errorMessage: "Gagal mengubah ketersediaan opsi.",
                })
              }
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`Hapus opsi "${option.name}"?`)) return;
                run(() => deleteOption(option.id), {
                  successMessage: "Opsi dihapus.",
                  errorMessage: "Gagal menghapus opsi.",
                  useErrorMessage: true,
                });
              }}
            >
              <Trash2Icon className="text-muted-foreground" />
              <span className="sr-only">Hapus {option.name}</span>
            </Button>
          </div>
        ))}

        <p className="text-xs text-muted-foreground">
          Angka kedua adalah tambahan harga dari harga dasar item. Contoh: 5000
          untuk {formatRupiah(5000)} lebih mahal, 0 kalau tidak menambah harga.
        </p>
      </div>

      <form
        action={(formData) =>
          run(() => createOption(group.id, formData), {
            successMessage: "Opsi ditambahkan.",
            errorMessage: "Gagal menambah opsi.",
            useErrorMessage: true,
          })
        }
        className="grid grid-cols-[1fr_auto_auto] items-center gap-2"
      >
        <Input name="name" placeholder="Large" required />
        <Input
          name="priceDelta"
          type="number"
          step={500}
          defaultValue={0}
          className="w-24"
          aria-label="Tambahan harga opsi baru"
        />
        <Button type="submit" variant="outline" size="icon" disabled={isPending}>
          <PlusIcon />
          <span className="sr-only">Tambah opsi</span>
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        disabled={isPending}
        onClick={() => {
          if (
            !window.confirm(
              `Hapus grup "${group.name}" beserta semua opsinya? Pesanan lama tidak terpengaruh.`,
            )
          )
            return;
          run(() => deleteOptionGroup(group.id), {
            successMessage: "Grup pilihan dihapus.",
            errorMessage: "Gagal menghapus grup.",
            useErrorMessage: true,
          });
        }}
      >
        Hapus grup ini
      </Button>
    </section>
  );
}
