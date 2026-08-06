import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set DIRECT_DATABASE_URL (or DATABASE_URL) to a Postgres connection string.",
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const TABLE_COUNT = 10;

async function seedUsers() {
  const accounts = [
    {
      email: "owner@latencoffee.com",
      name: "Owner Laten Coffee",
      role: "OWNER" as const,
    },
    {
      email: "kasir@latencoffee.com",
      name: "Kasir Laten Coffee",
      role: "ADMIN" as const,
    },
  ];

  const passwordHash = await bcrypt.hash("latencoffee123", 10);

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: { ...account, passwordHash },
    });
    console.log(`User: ${account.email} (${account.role}) / latencoffee123`);
  }
}

async function seedTables() {
  for (let number = 1; number <= TABLE_COUNT; number++) {
    await prisma.table.upsert({
      where: { id: number },
      update: {},
      create: { id: number },
    });
  }
  console.log(`Tables: ${TABLE_COUNT} meja`);
}

async function seedMenu() {
  if ((await prisma.menuItem.count()) > 0) {
    console.log("Menu: already populated, skipped");
    return;
  }

  const menu = [
    {
      category: "Kopi",
      items: [
        { name: "Kopi Susu Gula Aren", price: 22000, description: "Espresso, susu segar, gula aren" },
        { name: "Americano", price: 18000, description: "Espresso dan air" },
        { name: "Cappuccino", price: 25000, description: "Espresso dengan susu berbusa" },
      ],
    },
    {
      category: "Non-Kopi",
      items: [
        { name: "Matcha Latte", price: 26000, description: "Matcha premium dan susu" },
        { name: "Cokelat Panas", price: 23000, description: "Cokelat asli, disajikan hangat" },
      ],
    },
    {
      category: "Makanan Ringan",
      items: [
        { name: "Pisang Goreng", price: 15000, description: "Disajikan dengan cokelat atau keju" },
        { name: "Kentang Goreng", price: 20000, description: null },
      ],
    },
  ];

  for (const [index, group] of menu.entries()) {
    const category = await prisma.category.upsert({
      where: { name: group.category },
      update: {},
      create: { name: group.category, order: index },
    });

    for (const item of group.items) {
      await prisma.menuItem.create({
        data: { ...item, categoryId: category.id },
      });
    }
  }
  console.log(`Menu: ${menu.length} kategori`);
}

/** Sample orders so the kasir dashboard has something to work with. */
async function seedOrders() {
  if ((await prisma.order.count()) > 0) {
    console.log("Orders: already populated, skipped");
    return;
  }

  const menuItems = await prisma.menuItem.findMany({ take: 4 });
  if (menuItems.length === 0) {
    console.log("Orders: no menu items to order, skipped");
    return;
  }

  const drafts = [
    {
      tableId: 3,
      status: "DITERIMA" as const,
      paymentMethod: "QRIS" as const,
      paymentStatus: "SUDAH_BAYAR" as const,
      lines: [
        { item: menuItems[0], quantity: 2, note: "Less sugar" },
        { item: menuItems[2], quantity: 1, note: null },
      ],
    },
    {
      tableId: 7,
      status: "DITERIMA" as const,
      paymentMethod: "VIRTUAL_ACCOUNT" as const,
      paymentStatus: "BELUM_BAYAR" as const,
      lines: [{ item: menuItems[1], quantity: 1, note: null }],
    },
    {
      tableId: 1,
      status: "DIPROSES" as const,
      paymentMethod: "QRIS" as const,
      paymentStatus: "SUDAH_BAYAR" as const,
      lines: [
        { item: menuItems[3] ?? menuItems[0], quantity: 3, note: "Extra es" },
      ],
    },
  ];

  for (const [index, draft] of drafts.entries()) {
    const totalAmount = draft.lines.reduce(
      (sum, line) => sum + line.item.price * line.quantity,
      0,
    );

    await prisma.order.create({
      data: {
        queueNumber: index + 1,
        tableId: draft.tableId,
        status: draft.status,
        paymentMethod: draft.paymentMethod,
        paymentStatus: draft.paymentStatus,
        totalAmount,
        items: {
          create: draft.lines.map((line) => ({
            menuItemId: line.item.id,
            nameSnapshot: line.item.name,
            priceSnapshot: line.item.price,
            quantity: line.quantity,
            note: line.note,
          })),
        },
      },
    });
  }
  console.log(`Orders: ${drafts.length} pesanan contoh`);
}

async function main() {
  await seedUsers();
  await seedTables();
  await seedMenu();
  await seedOrders();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
