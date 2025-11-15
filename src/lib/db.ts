import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

/**
 * Prisma client singleton
 * Ensures single database connection across application
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

// Log Prisma queries in development
prisma.$on('query', (e) => {
  logger.debug({ duration: e.duration, query: e.query }, 'Database query');
});

prisma.$on('error', (e) => {
  logger.error({ target: e.target, message: e.message }, 'Database error');
});

prisma.$on('warn', (e) => {
  logger.warn({ target: e.target, message: e.message }, 'Database warning');
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connect to database
 * Tests connection and logs status
 */
export async function connectDb() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

/**
 * Disconnect from database
 * Graceful shutdown
 */
export async function disconnectDb() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect from database');
    throw error;
  }
}
