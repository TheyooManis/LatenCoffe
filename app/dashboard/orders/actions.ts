"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

/** Kasir/dapur may only move an order forward, never back. */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  DITERIMA: "DIPROSES",
  DIPROSES: "SELESAI",
};

export async function advanceOrderStatus(
  orderId: string,
  currentStatus: OrderStatus,
) {
  await requireUser();

  const nextStatus = NEXT_STATUS[currentStatus];
  if (!nextStatus) {
    throw new Error("Pesanan ini sudah selesai.");
  }

  // Guarded on currentStatus so two staff advancing the same order at once
  // can't skip a step — the second update matches no row and is rejected.
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: currentStatus },
    data: { status: nextStatus },
  });

  if (result.count === 0) {
    throw new Error("Status pesanan sudah berubah. Muat ulang halaman.");
  }

  revalidatePath("/dashboard/orders");
}

export async function markOrderPaid(orderId: string) {
  await requireUser();

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "SUDAH_BAYAR" },
  });

  revalidatePath("/dashboard/orders");
}
