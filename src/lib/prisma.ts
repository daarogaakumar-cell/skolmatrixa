import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  // In serverless environments (Vercel), limit pool size to 1 per function instance
  // to avoid exceeding Supabase connection limits.
  const adapter = new PrismaPg({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 1 : 10,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// In production (serverless), never cache the client — each function is ephemeral.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
