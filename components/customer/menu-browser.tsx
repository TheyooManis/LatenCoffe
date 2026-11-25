"use client";

import { useMemo, useRef, useState } from "react";
import { CoffeeIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemDialog } from "@/components/customer/item-dialog";
import { CartDialog } from "@/components/customer/cart-dialog";
import { useCart } from "@/hooks/use-cart";
import { lineKeyOf, type CartLine } from "@/lib/cart";
import { formatRupiah } from "@/lib/utils";

export type MenuOptionView = {
  id: string;
  name: string;
  priceDelta: number;
};

export type MenuOptionGroupView = {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: MenuOptionView[];
};

export type MenuItemView = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  optionGroups: MenuOptionGroupView[];
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItemView[];
};

/** A saved cart row joined to the menu as it exists right now. */
export type CartEntry = {
  key: string;
  item: MenuItemView;
  options: MenuOptionView[];
  /** Base price plus the chosen options, for one unit. */
  unitPrice: number;
  quantity: number;
  note: string | null;
};

export function MenuBrowser({
  tableToken,
  tableId,
  categories,
}: {
  tableToken: string;
  tableId: number;
  categories: MenuCategory[];
}) {
  const { lines, upsertLine, clear } = useCart(tableToken);
  const [editing, setEditing] = useState<{
    item: MenuItemView;
    line: CartLine | null;
  } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const sections = useRef(new Map<string, HTMLElement>());

  const itemsById = useMemo(() => {
    const map = new Map<string, MenuItemView>();
    for (const category of categories) {
      for (const item of category.items) map.set(item.id, item);
    }
    return map;
  }, [categories]);

  const entries = useMemo(() => {
    const result: CartEntry[] = [];

    for (const line of lines) {
      const item = itemsById.get(line.menuItemId);
      // Silently skip anything pulled from the menu since this cart was saved —
      // the customer sees an accurate cart instead of an error.
      if (!item) continue;

      const available = new Map(
        item.optionGroups.flatMap((group) =>
          group.options.map((option) => [option.id, option] as const),
        ),
      );
      const options = line.optionIds.flatMap((id) => {
        const option = available.get(id);
        return option ? [option] : [];
      });
      // A choice that has since sold out would silently change the price, so
      // drop the whole row rather than quietly reprice it.
      if (options.length !== line.optionIds.length) continue;

      result.push({
        key: lineKeyOf(line),
        item,
        options,
        unitPrice:
          item.price + options.reduce((sum, o) => sum + o.priceDelta, 0),
        quantity: line.quantity,
        note: line.note,
      });
    }

    return result;
  }, [lines, itemsById]);

  const quantityByItem = new Map<string, number>();
  for (const entry of entries) {
    quantityByItem.set(
      entry.item.id,
      (quantityByItem.get(entry.item.id) ?? 0) + entry.quantity,
    );
  }

  const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);
  const totalAmount = entries.reduce(
    (sum, e) => sum + e.unitPrice * e.quantity,
    0,
  );

  function handleItemSubmit(
    optionIds: string[],
    quantity: number,
    note: string | null,
  ) {
    if (editing) {
      upsertLine({
        replaceKey: editing.line ? lineKeyOf(editing.line) : undefined,
        menuItemId: editing.item.id,
        optionIds,
        quantity,
        note,
      });
    }
    setEditing(null);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Laten Coffee Shop
            </p>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Meja {tableId}
            </h1>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
            Pesan mandiri
          </span>
        </div>

        {categories.length > 1 && (
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  sections.current.get(category.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="shrink-0 rounded-full border border-zinc-200/90 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-all hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                {category.name}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content: Split-layout on Desktop/Tablet Landscape (lg:) */}
      <div className="flex-1 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8 lg:p-6">
        <main className="flex-1 px-4 pb-6 lg:px-0 lg:pb-0">
          {categories.length === 0 ? (
            <p className="py-20 text-center text-sm text-zinc-500">
              Menu belum tersedia. Silakan tanyakan ke kasir.
            </p>
          ) : (
            categories.map((category) => (
              <section
                key={category.id}
                ref={(node) => {
                  if (node) sections.current.set(category.id, node);
                  else sections.current.delete(category.id);
                }}
                className="scroll-mt-32 pt-6 first:pt-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                    {category.name}
                  </h2>
                  <span className="text-[11px] font-medium text-zinc-400">
                    {category.items.length} menu
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {category.items.map((item) => {
                    const quantity = quantityByItem.get(item.id) ?? 0;
                    const hasOptions = item.optionGroups.length > 0;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditing({ item, line: null })}
                        className="group relative flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-left transition-all duration-150 hover:border-zinc-300 hover:shadow-xs active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-900 transition-colors group-hover:text-zinc-950 dark:text-zinc-100">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                              {item.description}
                            </p>
                          )}
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
                              {formatRupiah(item.price)}
                            </span>
                            {hasOptions && (
                              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Kustom
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="relative shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              loading="lazy"
                              className="size-20 rounded-xl object-cover shadow-2xs transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex size-20 items-center justify-center rounded-xl bg-zinc-100/90 transition-colors group-hover:bg-zinc-200/70 dark:bg-zinc-800/80 dark:group-hover:bg-zinc-800">
                              <CoffeeIcon className="size-6 text-zinc-400" />
                            </div>
                          )}

                          <span className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white shadow-xs ring-2 ring-white transition-transform group-hover:scale-110 dark:bg-white dark:text-zinc-950 dark:ring-zinc-900">
                            {quantity > 0 ? quantity : <PlusIcon className="size-3.5" />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </main>

        {/* Desktop Sticky Order Summary Sidebar */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:rounded-2xl lg:border lg:border-zinc-200/90 lg:bg-white lg:p-5 lg:shadow-xs dark:lg:border-zinc-800 dark:lg:bg-zinc-900/80">
          <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Keranjang Pesanan
            </h3>
            <p className="text-xs text-zinc-500">Meja {tableId} &middot; {totalQuantity} item dipilih</p>
          </div>

          {entries.length === 0 ? (
            <div className="py-10 text-center">
              <CoffeeIcon className="mx-auto size-8 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Keranjang masih kosong
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Pilih menu di samping untuk menambahkan ke pesanan
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <li
                    key={entry.key}
                    className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {entry.item.name}
                      </p>
                      {entry.options.length > 0 && (
                        <p className="text-[11px] text-zinc-500">
                          {entry.options.map((o) => o.name).join(", ")}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs font-medium text-zinc-700 tabular-nums dark:text-zinc-300">
                        {formatRupiah(entry.unitPrice * entry.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          upsertLine({
                            replaceKey: entry.key,
                            menuItemId: entry.item.id,
                            optionIds: entry.options.map((o) => o.id),
                            quantity: entry.quantity - 1,
                            note: entry.note,
                          })
                        }
                        className="flex size-6 items-center justify-center rounded-md border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        -
                      </button>
                      <span className="w-4 text-center text-xs font-semibold tabular-nums">
                        {entry.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          upsertLine({
                            replaceKey: entry.key,
                            menuItemId: entry.item.id,
                            optionIds: entry.options.map((o) => o.id),
                            quantity: entry.quantity + 1,
                            note: entry.note,
                          })
                        }
                        className="flex size-6 items-center justify-center rounded-md border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-zinc-200/90 pt-3 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">Total</span>
                  <span className="text-base font-bold text-zinc-900 tabular-nums dark:text-white">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>

                <Button
                  type="button"
                  className="mt-3.5 h-11 w-full rounded-xl bg-zinc-900 font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                  onClick={() => setCartOpen(true)}
                >
                  Lanjut ke Pembayaran
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Floating Bottom Cart Bar for Mobile & Tablet (< lg) */}
      {totalQuantity > 0 && (
        <div className="sticky bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
          <Button
            type="button"
            className="h-12 w-full justify-between rounded-xl px-4 text-base font-semibold shadow-xs"
            onClick={() => setCartOpen(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingBagIcon className="size-5" />
              {totalQuantity} item
            </span>
            <span className="tabular-nums">{formatRupiah(totalAmount)}</span>
          </Button>
        </div>
      )}

      <ItemDialog
        item={editing?.item ?? null}
        line={editing?.line ?? null}
        onClose={() => setEditing(null)}
        onSubmit={handleItemSubmit}
      />

      <CartDialog
        open={cartOpen}
        onOpenChange={setCartOpen}
        tableToken={tableToken}
        tableId={tableId}
        entries={entries}
        onChangeQuantity={(entry, quantity) =>
          upsertLine({
            replaceKey: entry.key,
            menuItemId: entry.item.id,
            optionIds: entry.options.map((option) => option.id),
            quantity,
            note: entry.note,
          })
        }
        onEditEntry={(entry) => {
          setCartOpen(false);
          setEditing({
            item: entry.item,
            line: {
              menuItemId: entry.item.id,
              optionIds: entry.options.map((option) => option.id),
              quantity: entry.quantity,
              note: entry.note,
            },
          });
        }}
        onOrdered={() => {
          setCartOpen(false);
          clear();
        }}
      />
    </>
  );
}
