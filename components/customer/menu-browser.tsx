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
                className="shrink-0 rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 active:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:active:bg-zinc-900"
              >
                {category.name}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 px-4 pb-6">
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
              // Clears the sticky header when a category chip scrolls here.
              className="scroll-mt-32 pt-6"
            >
              <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
                {category.name}
              </h2>

              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {category.items.map((item) => {
                  const quantity = quantityByItem.get(item.id) ?? 0;
                  const hasOptions = item.optionGroups.length > 0;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setEditing({ item, line: null })}
                        className="flex w-full items-start gap-3 py-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
                              {item.description}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                            {formatRupiah(item.price)}
                            {hasOptions && (
                              <span className="ml-1.5 text-xs font-normal text-zinc-500">
                                bisa dikustom
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="relative shrink-0">
                          {item.imageUrl ? (
                            // Plain <img>: the URL is owner-supplied, so
                            // next/image would need every possible host allowed
                            // in next.config.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt=""
                              loading="lazy"
                              className="size-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex size-20 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                              <CoffeeIcon className="size-6 text-zinc-400" />
                            </div>
                          )}

                          <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white ring-2 ring-white dark:bg-zinc-50 dark:text-zinc-900 dark:ring-zinc-950">
                            {quantity > 0 ? quantity : <PlusIcon className="size-4" />}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>

      {totalQuantity > 0 && (
        <div className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-950">
          <Button
            type="button"
            className="h-12 w-full justify-between px-4 text-base"
            onClick={() => setCartOpen(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingBagIcon />
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
