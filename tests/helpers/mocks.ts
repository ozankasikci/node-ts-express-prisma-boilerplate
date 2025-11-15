import { vi } from 'vitest';

/**
 * Mock Redis Client
 * Provides in-memory Redis implementation for testing
 */
export function createMockRedis() {
  const store = new Map<string, string>();

  return {
    get: vi.fn(async (key: string) => store.get(key) || null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    setex: vi.fn(async (key: string, seconds: number, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    }),
    exists: vi.fn(async (key: string) => (store.has(key) ? 1 : 0)),
    expire: vi.fn(async () => 1),
    ttl: vi.fn(async () => -1),
    keys: vi.fn(async (pattern: string) => {
      if (pattern === '*') {
        return Array.from(store.keys());
      }
      return [];
    }),
    flushall: vi.fn(async () => {
      store.clear();
      return 'OK';
    }),
    quit: vi.fn(async () => 'OK'),
    disconnect: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
  };
}

/**
 * Mock BullMQ Queue
 * Provides in-memory queue implementation for testing
 */
export function createMockQueue(name = 'test-queue') {
  const jobs = new Map<string, any>();
  let jobIdCounter = 0;

  return {
    name,
    add: vi.fn(async (jobName: string, data: any, opts?: any) => {
      const jobId = `job-${++jobIdCounter}`;
      const job = {
        id: jobId,
        name: jobName,
        data,
        opts,
        timestamp: Date.now(),
        attemptsMade: 0,
        processedOn: null,
        finishedOn: null,
        failedReason: null,
      };
      jobs.set(jobId, job);
      return job;
    }),
    getJob: vi.fn(async (jobId: string) => jobs.get(jobId) || null),
    getJobs: vi.fn(async () => Array.from(jobs.values())),
    remove: vi.fn(async (jobId: string) => {
      jobs.delete(jobId);
    }),
    clean: vi.fn(async () => {
      jobs.clear();
    }),
    close: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
    isPaused: vi.fn(async () => false),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
  };
}

/**
 * Mock BullMQ Worker
 * Provides mock worker for testing job processing
 */
export function createMockWorker(queueName: string, processor: any) {
  return {
    queueName,
    processor,
    run: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
  };
}

/**
 * Mock Pino Logger
 * Provides silent logger for testing (no console output)
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(() => createMockLogger()),
  };
}

/**
 * Reset all mocks
 * Call this in beforeEach to ensure clean state
 */
export function resetAllMocks() {
  vi.clearAllMocks();
}
