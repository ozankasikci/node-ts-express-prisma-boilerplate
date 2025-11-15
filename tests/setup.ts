import { beforeAll, afterAll, beforeEach } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = 'redis://localhost:6379';
});

beforeEach(async () => {
  // Reset mocks and database state before each test
  // This will be extended when we implement database testing
});

afterAll(async () => {
  // Cleanup after all tests
  // Close database connections, Redis connections, etc.
});
