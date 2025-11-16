import { PrismaClient } from "@prisma/client";

// --- Create a single shared PrismaClient instance ---
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

// Attach to global for reuse (important for Vercel)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;

// Export only one Prisma instance
export const prisma = baseClient;
export default prisma;
