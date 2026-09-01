"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/guards";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  createSignedImageUpload,
  deleteStoredImage,
} from "@/lib/storage";

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

/* -------------------------------------------------------------------------
 * Item options (ukuran, topping)
 * ---------------------------------------------------------------------- */

function parseOptionGroupForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nama pilihan wajib diisi.");

  const isRequired = formData.get("isRequired") === "on";
  const maxSelect = Number(formData.get("maxSelect") ?? 1);
  if (!Number.isInteger(maxSelect) || maxSelect < 1 || maxSelect > 20) {
    throw new Error("Jumlah maksimal pilihan harus antara 1 dan 20.");
  }

  return { name, isRequired, maxSelect };
}

function parseOptionForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nama opsi wajib diisi.");

  const priceDelta = Number(formData.get("priceDelta") ?? 0);
  if (!Number.isFinite(priceDelta)) {
    throw new Error("Tambahan harga tidak valid.");
  }

  return { name, priceDelta: Math.round(priceDelta) };
}

export async function createOptionGroup(menuItemId: string, formData: FormData) {
  await requireOwner();

  const last = await prisma.menuOptionGroup.findFirst({
    where: { menuItemId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  try {
    await prisma.menuOptionGroup.create({
      data: {
        ...parseOptionGroupForm(formData),
        menuItemId,
        order: (last?.order ?? -1) + 1,
      },
    });
  } catch (error) {
    rethrowFriendly(error, {
      P2003: "Item menu tidak ditemukan, mungkin sudah dihapus.",
    });
  }
  revalidatePath("/dashboard/menu");
}

export async function updateOptionGroup(groupId: string, formData: FormData) {
  await requireOwner();
  await prisma.menuOptionGroup.update({
    where: { id: groupId },
    data: parseOptionGroupForm(formData),
  });
  revalidatePath("/dashboard/menu");
}

export async function deleteOptionGroup(groupId: string) {
  await requireOwner();
  // Options cascade with the group; past orders keep their own snapshots.
  await prisma.menuOptionGroup.delete({ where: { id: groupId } });
  revalidatePath("/dashboard/menu");
}

export async function createOption(groupId: string, formData: FormData) {
  await requireOwner();

  const last = await prisma.menuOption.findFirst({
    where: { groupId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  try {
    await prisma.menuOption.create({
      data: {
        ...parseOptionForm(formData),
        groupId,
        order: (last?.order ?? -1) + 1,
      },
    });
  } catch (error) {
    rethrowFriendly(error, {
      P2003: "Grup pilihan tidak ditemukan, mungkin sudah dihapus.",
    });
  }
  revalidatePath("/dashboard/menu");
}

export async function updateOption(optionId: string, formData: FormData) {
  await requireOwner();
  await prisma.menuOption.update({
    where: { id: optionId },
    data: parseOptionForm(formData),
  });
  revalidatePath("/dashboard/menu");
}

export async function setOptionAvailability(
  optionId: string,
  isAvailable: boolean,
) {
  await requireOwner();
  await prisma.menuOption.update({
    where: { id: optionId },
    data: { isAvailable },
  });
  revalidatePath("/dashboard/menu");
}

export async function deleteOption(optionId: string) {
  await requireOwner();

  try {
    await prisma.menuOption.delete({ where: { id: optionId } });
  } catch (error) {
    rethrowFriendly(error, {
      P2003:
        "Opsi ini sudah dipakai di pesanan. Nonaktifkan saja agar riwayat tetap utuh.",
    });
  }
  revalidatePath("/dashboard/menu");
}

/**
 * Hands the browser a one-shot signed URL to upload a menu photo to.
 *
 * The file itself never passes through the server: Server Actions cap request
 * bodies, and streaming a 5 MB photo through Next just to forward it would also
 * cost us the upload progress the owner sees.
 */
export async function createMenuImageUpload(contentType: string, size: number) {
  await requireOwner();

  if (!ACCEPTED_IMAGE_TYPES.includes(contentType)) {
    throw new Error("Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.");
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_BYTES) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }

  return createSignedImageUpload(contentType);
}

/**
 * Removes an uploaded image that ended up unreferenced — the owner replaced it,
 * cleared it, or closed the dialog without saving.
 */
export async function deleteMenuImage(publicUrl: string) {
  await requireOwner();
  await deleteStoredImage(publicUrl);
}
