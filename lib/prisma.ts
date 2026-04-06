import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  __quizPrisma?: PrismaClient;
};

const connectionString =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
const adapter = new PrismaPg(connectionString);

export const prisma =
  globalForPrisma.__quizPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__quizPrisma = prisma;
}
