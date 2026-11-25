import { redirect } from "next/navigation";
import {
  ImageIcon,
  PencilIcon,
  PlusIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
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
import { OptionGroupsDialog } from "@/components/menu/option-groups-dialog";
import { cn, formatRupiah } from "@/lib/utils";

export default async function MenuManagementPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const isOwner = session.user.role === "OWNER";

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      menuItems: {
        orderBy: { name: "asc" },
        include: {
          optionGroups: {
            orderBy: [{ order: "asc" }, { name: "asc" }],
            include: {
              options: { orderBy: [{ order: "asc" }, { name: "asc" }] },
            },
          },
        },
      },
    },
  });

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Kelola Menu
            </h1>
            {!isOwner && (
              <Badge variant="outline" className="text-xs">
                Mode Kasir
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isOwner
              ? "Perubahan di sini langsung tampil di menu digital pelanggan."
              : "Tandai ketersediaan stok menu dan topping yang habis secara real-time."}
          </p>
        </div>

        {isOwner && (
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
        )}
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
                {isOwner && (
                  <DeleteCategoryButton
                    categoryId={category.id}
                    categoryName={category.name}
                    disabled={category.menuItems.length > 0}
                  />
                )}
              </div>

              {category.menuItems.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  Belum ada item di kategori ini.
                </p>
              ) : (
                <>
                  {/* Mobile Card List View (< sm) */}
                  <div className="space-y-3 sm:hidden">
                    {category.menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-amber-900/10 bg-white/95 p-3.5 shadow-xs transition-all dark:border-amber-950/40 dark:bg-[#2C1F1A]/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="size-14 shrink-0 rounded-xl object-cover shadow-2xs ring-1 ring-black/5"
                              />
                            ) : (
                              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-900 dark:bg-[#1A1412] dark:text-amber-400">
                                <ImageIcon className="size-6 text-amber-700/60 dark:text-amber-500/60" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                                  {item.description}
                                </p>
                              )}
                              <p className="mt-0.5 text-sm font-bold text-[#C87D43] tabular-nums dark:text-[#E09B67]">
                                {formatRupiah(item.price)}
                              </p>
                            </div>
                          </div>

                          {/* Quick Toggle Switch for Cashier (Large 48px touch target) */}
                          <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-zinc-50/80 px-2 py-1.5 dark:bg-[#1A1412]/60">
                            <AvailabilitySwitch
                              itemId={item.id}
                              isAvailable={item.isAvailable}
                              size="lg"
                            />
                            <span className={cn(
                              "text-[10px] font-bold tracking-tight uppercase",
                              item.isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                            )}>
                              {item.isAvailable ? "Tersedia" : "Habis"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-amber-900/5 pt-2.5 dark:border-amber-950/40">
                          <OptionGroupsDialog
                            itemId={item.id}
                            itemName={item.name}
                            groups={item.optionGroups}
                            isOwner={isOwner}
                            triggerRender={
                              <Button variant="ghost" size="xs" className="h-7 text-xs font-medium text-zinc-600 hover:text-amber-900 dark:text-zinc-400 dark:hover:text-amber-200" />
                            }
                          >
                            <SlidersHorizontalIcon className="size-3.5" />
                            {item.optionGroups.length > 0
                              ? `${item.optionGroups.length} Opsi Varian`
                              : "Opsi Varian"}
                          </OptionGroupsDialog>

                          {isOwner && (
                            <div className="flex items-center gap-1.5">
                              <MenuItemDialog
                                categories={categoryOptions}
                                item={item}
                                triggerRender={
                                  <Button variant="outline" size="xs" className="h-7 text-xs" />
                                }
                              >
                                <PencilIcon className="size-3" />
                                <span>Edit</span>
                              </MenuItemDialog>
                              <DeleteMenuItemButton
                                itemId={item.id}
                                itemName={item.name}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop & Tablet Table View (>= sm) */}
                  <div className="hidden overflow-hidden rounded-2xl border border-zinc-200/90 sm:block dark:border-zinc-800">
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
                              <div className="flex items-center gap-3">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="size-10 shrink-0 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                                    <ImageIcon className="size-4 text-zinc-400" />
                                  </div>
                                )}
                                <div>
                                  {item.name}
                                  {item.description && (
                                    <p className="mt-0.5 text-xs font-normal text-zinc-500">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {formatRupiah(item.price)}
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
                                <OptionGroupsDialog
                                  itemId={item.id}
                                  itemName={item.name}
                                  groups={item.optionGroups}
                                  isOwner={isOwner}
                                  triggerRender={
                                    <Button variant="ghost" size="sm" />
                                  }
                                >
                                  <SlidersHorizontalIcon />
                                  {item.optionGroups.length > 0
                                    ? `${item.optionGroups.length} pilihan`
                                    : "Pilihan"}
                                </OptionGroupsDialog>
                                {isOwner && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
