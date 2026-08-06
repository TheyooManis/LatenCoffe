"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

async function requireOwner() {
  const session = await auth();
  if (session?.user?.role !== "OWNER") {
    throw new Error("Hanya owner yang dapat mengelola menu.");
  }
}

function parsePrice(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    throw new Error("Harga tidak valid.");
  }
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Harga tidak valid.");
  }
  return Math.round(price);
}

function rethrowFriendly(
  error: unknown,
  messagesByCode: Partial<Record<string, string>>,
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    messagesByCode[error.code]
  ) {
    throw new Error(messagesByCode[error.code]);
  }
  throw error;
}

export async function createCategory(formData: FormData) {
  await requireOwner();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Nama kategori wajib diisi.");
  }

  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    throw new Error("Kategori dengan nama ini sudah ada.");
  }

  try {
    const lastCategory = await prisma.category.findFirst({
      orderBy: { order: "desc" },
    });
    await prisma.category.create({
      data: { name, order: (lastCategory?.order ?? -1) + 1 },
    });
  } catch (error) {
    rethrowFriendly(error, { P2002: "Kategori dengan nama ini sudah ada." });
  }
  revalidatePath("/dashboard/menu");
}

export async function deleteCategory(id: string) {
  await requireOwner();

  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    rethrowFriendly(error, {
      P2003:
        "Kategori masih memiliki item menu. Pindahkan atau hapus item tersebut dulu.",
    });
  }
  revalidatePath("/dashboard/menu");
}

function parseMenuItemForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const price = parsePrice(formData.get("price"));
  const isAvailable = formData.get("isAvailable") === "on";

  if (!name || !categoryId) {
    throw new Error("Nama dan kategori wajib diisi.");
  }

  return {
    name,
    categoryId,
    description: description || null,
    imageUrl: imageUrl || null,
    price,
    isAvailable,
  };
}

export async function createMenuItem(formData: FormData) {
  await requireOwner();

  const data = parseMenuItemForm(formData);

  try {
    await prisma.menuItem.create({ data });
  } catch (error) {
    rethrowFriendly(error, {
      P2003: "Kategori tidak ditemukan, mungkin sudah dihapus.",
    });
  }
  revalidatePath("/dashboard/menu");
}

export async function updateMenuItem(id: string, formData: FormData) {
  await requireOwner();

  const data = parseMenuItemForm(formData);

  try {
    await prisma.menuItem.update({ where: { id }, data });
  } catch (error) {
    rethrowFriendly(error, {
      P2003: "Kategori tidak ditemukan, mungkin sudah dihapus.",
    });
  }
  revalidatePath("/dashboard/menu");
}

export async function deleteMenuItem(id: string) {
  await requireOwner();
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath("/dashboard/menu");
}

export async function setMenuItemAvailability(id: string, isAvailable: boolean) {
  await requireOwner();
  await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
  revalidatePath("/dashboard/menu");
}
