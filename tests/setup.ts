// IMPORTANT: Set test DATABASE_URL before any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5434/test_db';
process.env.LOG_LEVEL = 'fatal'; // Valid enum: trace, debug, info, warn, error, fatal (fatal is highest/quietest)
process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-characters-long';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CONFIG_ENCRYPTION_KEY = 'TnLiHyYNuboynP/t2+mZAj3QLrIgX8zS12hGPqVELH0='; // base64 encoded 32-byte key for tests

import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Mock Redis before any imports
vi.mock('ioredis', () => {
  return {
    default: class Redis {
      get = vi.fn().mockResolvedValue(null);
      set = vi.fn().mockResolvedValue('OK');
      setex = vi.fn().mockResolvedValue('OK');
      del = vi.fn().mockResolvedValue(1);
      exists = vi.fn().mockResolvedValue(0);
      expire = vi.fn().mockResolvedValue(1);
      ttl = vi.fn().mockResolvedValue(-1);
      keys = vi.fn().mockResolvedValue([]);
      flushall = vi.fn().mockResolvedValue('OK');
      quit = vi.fn().mockResolvedValue('OK');
      disconnect = vi.fn();
      on = vi.fn();
      once = vi.fn();
      removeListener = vi.fn();
      sendCommand = vi.fn().mockResolvedValue('OK');
      defineCommand = vi.fn();
      call = vi.fn().mockResolvedValue('OK');
      multi = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([[null, 'OK']]),
      });
      pipeline = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([[null, 'OK']]),
      });

      constructor() {
        // No-op constructor
      }
    },
  };
});

// Mock rate-limit-redis
vi.mock('rate-limit-redis', () => {
  return {
    default: class MockRedisStore {
      increment = vi.fn().mockResolvedValue({ totalHits: 1, resetTime: new Date() });
      decrement = vi.fn().mockResolvedValue(undefined);
      resetKey = vi.fn().mockResolvedValue(undefined);
      constructor() {}
    },
  };
});

// Mock BullMQ
vi.mock('bullmq', () => {
  return {
    Queue: class MockQueue {
      name: string;
      constructor(name: string) {
        this.name = name;
      }
      add = vi.fn().mockResolvedValue({ id: 'mock-job-id' });
      on = vi.fn();
      close = vi.fn().mockResolvedValue(undefined);
    },
    Worker: class MockWorker {
      on = vi.fn();
      close = vi.fn().mockResolvedValue(undefined);
    },
  };
});

// Global test database
let prisma: PrismaClient;

// Global test setup
beforeAll(async () => {
  // Initialize Prisma client (env vars already set above)
  prisma = new PrismaClient();

  // Push schema to test database (no migrations needed)
  try {
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to push schema:', error);
  }

  // Store for tests
  (global as any).testPrisma = prisma;
});

beforeEach(async () => {
  // Clean database before each test
  // Delete in reverse order of dependencies
  await prisma.configHistory.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.taskResult.deleteMany();
  await prisma.task.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  // Cleanup after all tests
  await prisma.$disconnect();
});

// Export for use in tests
export { prisma };
