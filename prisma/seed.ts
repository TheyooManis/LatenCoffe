import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "owner@latencoffee.com";
  const passwordHash = await bcrypt.hash("latencoffee123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Owner Laten Coffee",
      email,
      passwordHash,
      role: "OWNER",
    },
  });

  console.log(`Seeded user: ${user.email} (password: latencoffee123)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
