import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set DIRECT_DATABASE_URL (or DATABASE_URL) to a Postgres connection string.",
  );
}

if (connectionString.startsWith("prisma+postgres://")) {
  throw new Error(
    "DIRECT_DATABASE_URL must be a raw postgres:// connection string — the prisma+postgres:// proxy URL from `prisma dev` can't be used by @prisma/adapter-pg. Set DIRECT_DATABASE_URL to the raw connection string printed by `prisma dev`.",
  );
}

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
