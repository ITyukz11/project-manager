import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// --- Create a single shared PrismaClient instance ---
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

function createPrismaClient() {
  return new PrismaClient({
    log: ["error", "warn"],
  }).$extends(withAccelerate());
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Attach to global for reuse (important for Vercel)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export only one Prisma instance
export { prisma };
export default prisma;
