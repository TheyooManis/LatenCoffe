import { redirect } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MenuItemDialog } from "@/components/menu/menu-item-dialog";
import { AddCategoryDialog } from "@/components/menu/add-category-dialog";
import { DeleteMenuItemButton } from "@/components/menu/delete-menu-item-button";
import { DeleteCategoryButton } from "@/components/menu/delete-category-button";
import { AvailabilitySwitch } from "@/components/menu/availability-switch";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function MenuManagementPage() {
  const session = await auth();
  if (session?.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { menuItems: { orderBy: { name: "asc" } } },
  });

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Kelola Menu
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Perubahan di sini langsung tampil di menu digital pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddCategoryDialog />
          {categoryOptions.length > 0 && (
            <MenuItemDialog
              categories={categoryOptions}
              triggerRender={<Button />}
            >
              <PlusIcon />
              Tambah Item
            </MenuItemDialog>
          )}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Belum ada kategori. Buat kategori dulu sebelum menambah item menu.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
                  {category.name}
                </h2>
                <DeleteCategoryButton
                  categoryId={category.id}
                  categoryName={category.name}
                  disabled={category.menuItems.length > 0}
                />
              </div>

              {category.menuItems.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  Belum ada item di kategori ini.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-1">Tersedia</TableHead>
                        <TableHead className="w-1" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.menuItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.name}
                            {item.description && (
                              <p className="mt-0.5 text-xs font-normal text-zinc-500">
                                {item.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {currency.format(item.price)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={item.isAvailable ? "secondary" : "outline"}
                            >
                              {item.isAvailable ? "Tersedia" : "Habis"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AvailabilitySwitch
                              itemId={item.id}
                              isAvailable={item.isAvailable}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <MenuItemDialog
                                categories={categoryOptions}
                                item={item}
                                triggerRender={
                                  <Button variant="ghost" size="icon-sm" />
                                }
                              >
                                <PencilIcon />
                                <span className="sr-only">Ubah {item.name}</span>
                              </MenuItemDialog>
                              <DeleteMenuItemButton
                                itemId={item.id}
                                itemName={item.name}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
