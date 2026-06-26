import { PrismaClient } from '@prisma/client';

/**
 * Database configuration and Prisma client instance
 * This file handles the database connection and provides a singleton instance
 * of the Prisma client throughout the application.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma log levels:
// - default: errors only (no query spam in dev logs)
// - set PRISMA_DEBUG=1 in env to opt into full query + warn logging when debugging
const prismaLogLevels: ('query' | 'error' | 'warn')[] =
  process.env.PRISMA_DEBUG === '1' ? ['query', 'error', 'warn'] : ['error'];

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: prismaLogLevels,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
