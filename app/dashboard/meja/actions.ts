"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/guards";

/**
 * Adds the next table number. Numbering is contiguous from 1 so it matches the
 * physical numbers on the tables.
 */
export async function createTable() {
  await requireOwner();

  const last = await prisma.table.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  await prisma.table.create({ data: { id: (last?.id ?? 0) + 1 } });
  revalidatePath("/dashboard/meja");
}

export async function setTableActive(id: number, isActive: boolean) {
  await requireOwner();
  await prisma.table.update({ where: { id }, data: { isActive } });
  revalidatePath("/dashboard/meja");
}

/**
 * Issues a fresh QR token, which instantly invalidates every printed sticker
 * for that table. For when a sticker is photographed and shared, or a table is
 * retired and its number reused.
 */
export async function regenerateTableToken(id: number) {
  await requireOwner();
  await prisma.table.update({ where: { id }, data: { qrToken: randomUUID() } });
  revalidatePath("/dashboard/meja");
}

export async function deleteTable(id: number) {
  await requireOwner();

  // Orders reference the table, so a table that has ever been used cannot be
  // removed without losing history — deactivate it instead.
  const orderCount = await prisma.order.count({ where: { tableId: id } });
  if (orderCount > 0) {
    throw new Error(
      "Meja ini sudah punya riwayat pesanan. Nonaktifkan saja agar laporan tetap utuh.",
    );
  }

  await prisma.table.delete({ where: { id } });
  revalidatePath("/dashboard/meja");
}
