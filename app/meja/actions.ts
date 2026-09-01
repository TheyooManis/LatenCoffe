"use server";

import { prisma } from "@/lib/prisma";
import { startOfTodayWita } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/generated/prisma/enums";

const MAX_LINES = 30;
const MAX_QUANTITY = 20;
const MAX_OPTIONS_PER_LINE = 20;
const MAX_ORDER_NOTE = 200;
const MAX_ITEM_NOTE = 120;

/**
 * Fixed key for the transaction-scoped advisory lock that serialises queue
 * numbering. Any constant works as long as nothing else in the database uses
 * the same one.
 */
const QUEUE_LOCK_KEY = 728_101;

export type NewOrderLine = {
  menuItemId: string;
  optionIds: string[];
  quantity: number;
  note: string | null;
};

export type NewOrderInput = {
  qrToken: string;
  lines: NewOrderLine[];
  note: string | null;
  paymentMethod: PaymentMethod;
};

function normaliseLines(lines: NewOrderLine[]): NewOrderLine[] {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Keranjang masih kosong.");
  }
  if (lines.length > MAX_LINES) {
    throw new Error("Terlalu banyak jenis item dalam satu pesanan.");
  }

  const byKey = new Map<string, NewOrderLine>();

  for (const line of lines) {
    const menuItemId = typeof line?.menuItemId === "string" ? line.menuItemId : "";
    const quantity = Number(line?.quantity);

    if (
      !menuItemId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      throw new Error("Jumlah item tidak valid.");
    }

    const optionIds = Array.isArray(line.optionIds)
      ? [...new Set(line.optionIds.filter((id) => typeof id === "string" && id))].sort()
      : [];
    if (optionIds.length > MAX_OPTIONS_PER_LINE) {
      throw new Error("Terlalu banyak pilihan pada satu item.");
    }

    // Same item with the same options must arrive as one line, or the barista
    // reads it as two separate cups.
    const key = [menuItemId, ...optionIds].join("|");
    if (byKey.has(key)) {
      throw new Error("Keranjang tidak valid. Muat ulang halaman menu.");
    }

    const note =
      typeof line.note === "string" ? line.note.trim().slice(0, MAX_ITEM_NOTE) : "";

    byKey.set(key, { menuItemId, optionIds, quantity, note: note || null });
  }

  return [...byKey.values()];
}

/**
 * Places a customer order for the table behind `qrToken`.
 *
 * This runs unauthenticated by design — customers never log in (see CLAUDE.md).
 * So everything that decides money or routing is re-derived here from the
 * database: the browser only says *which* item, *which* options, and *how
 * many*. Prices, names, the table number, and the queue number all come from
 * the server.
 */
export async function createOrder(input: NewOrderInput) {
  const table = await prisma.table.findUnique({
    where: { qrToken: String(input?.qrToken ?? "") },
    select: { id: true, isActive: true },
  });
  if (!table?.isActive) {
    throw new Error("Meja tidak dikenal. Silakan scan ulang QR di meja Anda.");
  }

  if (
    input.paymentMethod !== "QRIS" &&
    input.paymentMethod !== "VIRTUAL_ACCOUNT"
  ) {
    throw new Error("Metode pembayaran belum dipilih.");
  }

  const lines = normaliseLines(input.lines);

  // Availability is checked at order time, not just at browse time — the bar
  // may have run out while the customer was still deciding.
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: [...new Set(lines.map((line) => line.menuItemId))] },
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      optionGroups: {
        select: {
          id: true,
          name: true,
          isRequired: true,
          maxSelect: true,
          options: {
            select: { id: true, name: true, priceDelta: true, isAvailable: true },
          },
        },
      },
    },
  });
  const availableById = new Map(menuItems.map((item) => [item.id, item]));

  const pricedLines = lines.map((line) => {
    const item = availableById.get(line.menuItemId);
    if (!item) {
      throw new Error(
        "Ada item yang sudah habis. Buka lagi menu dan perbarui keranjang Anda.",
      );
    }

    // Flatten this item's own options; anything outside that set is rejected,
    // so a crafted request cannot borrow a cheap option from another item.
    const optionLookup = new Map(
      item.optionGroups.flatMap((group) =>
        group.options.map((option) => [option.id, { group, option }] as const),
      ),
    );

    const selectedPerGroup = new Map<string, number>();
    const chosen = line.optionIds.map((optionId) => {
      const found = optionLookup.get(optionId);
      if (!found || !found.option.isAvailable) {
        throw new Error(
          `Pilihan pada "${item.name}" sudah tidak tersedia. Perbarui keranjang Anda.`,
        );
      }
      selectedPerGroup.set(
        found.group.id,
        (selectedPerGroup.get(found.group.id) ?? 0) + 1,
      );
      return {
        menuOptionId: found.option.id,
        groupNameSnapshot: found.group.name,
        nameSnapshot: found.option.name,
        priceDeltaSnapshot: found.option.priceDelta,
      };
    });

    for (const group of item.optionGroups) {
      const count = selectedPerGroup.get(group.id) ?? 0;
      if (group.isRequired && count === 0) {
        throw new Error(`${group.name} pada "${item.name}" wajib dipilih.`);
      }
      if (count > group.maxSelect) {
        throw new Error(
          `${group.name} pada "${item.name}" maksimal ${group.maxSelect} pilihan.`,
        );
      }
    }

    return {
      menuItemId: item.id,
      nameSnapshot: item.name,
      priceSnapshot: item.price,
      quantity: line.quantity,
      note: line.note,
      options: { create: chosen },
    };
  });

  const totalAmount = pricedLines.reduce(
    (sum, line) =>
      sum +
      (line.priceSnapshot +
        line.options.create.reduce(
          (delta, option) => delta + option.priceDeltaSnapshot,
          0,
        )) *
        line.quantity,
    0,
  );

  const orderNote =
    typeof input.note === "string"
      ? input.note.trim().slice(0, MAX_ORDER_NOTE) || null
      : null;

  const order = await prisma.$transaction(async (tx) => {
    // Two customers pressing "Pesan" in the same second must not both be told
    // "Antrian #7" — the barista would call one number for two tables. The lock
    // is transaction-scoped, so it releases on commit and is pooler-safe.
    //
    // $executeRaw, not $queryRaw: the function returns void, which the pg
    // driver adapter cannot decode as a result column.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${QUEUE_LOCK_KEY}::bigint)`;

    const lastToday = await tx.order.findFirst({
      where: { createdAt: { gte: startOfTodayWita() } },
      orderBy: { queueNumber: "desc" },
      select: { queueNumber: true },
    });

    return tx.order.create({
      data: {
        queueNumber: (lastToday?.queueNumber ?? 0) + 1,
        tableId: table.id,
        paymentMethod: input.paymentMethod,
        totalAmount,
        note: orderNote,
        items: { create: pricedLines },
      },
      select: { id: true },
    });
  });

  // The kasir board is force-dynamic and wakes on the Order NOTIFY trigger, so
  // there is nothing to revalidate here.
  return { orderId: order.id };
}
