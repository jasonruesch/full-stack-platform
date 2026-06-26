import { PrismaClient } from '@prisma/client';

/**
 * Single PrismaClient for the process. In dev, `tsx watch` reloads the module
 * graph on change; reusing a client cached on `globalThis` avoids exhausting
 * Postgres connections across reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
