# Test Suite Documentation

Comprehensive testing infrastructure for the Node.js/TypeScript/Express/Prisma boilerplate.

## Quick Start

```bash
# 1. Start test database (Docker)
npm run test:db:up

# 2. Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test tests/integration/auth.test.ts

# Stop test database when done
npm run test:db:down
```

### Automated Integration Tests

```bash
# Run integration tests (starts DB, runs tests, stops DB)
npm run test:integration
```

## Test Structure

```
tests/
├── setup.ts              # Global test configuration
├── helpers/              # Test helper utilities
│   ├── mocks.ts         # Mock implementations (Redis, Queue, Logger)
│   ├── request.ts       # HTTP request helpers
│   └── database.ts      # Database seeding and cleanup
├── fixtures/             # Test data factories
│   ├── users.ts         # User fixtures
│   ├── tasks.ts         # Task fixtures
│   └── auth.ts          # Auth token fixtures
├── integration/          # API endpoint integration tests
└── unit/                 # Component unit tests
```

## Testing Patterns

### AAA Pattern (Arrange-Act-Assert)

All tests follow the Arrange-Act-Assert pattern:

```typescript
test('should create user and return token', async () => {
  // Arrange: Set up test data and dependencies
  const userData = createUserData({ email: 'test@example.com' });

  // Act: Execute the operation being tested
  const response = await request(app)
    .post('/auth/register')
    .send(userData);

  // Assert: Verify the results
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('token');
});
```

### Using Fixtures

Fixtures provide reusable, type-safe test data:

```typescript
import { createUserData, createMultipleUsers } from '../fixtures/users';
import { createTaskData } from '../fixtures/tasks';
import { createAccessToken } from '../fixtures/auth';

test('example test', async () => {
  // Create single user
  const user = createUserData({ email: 'custom@example.com' });

  // Create multiple users
  const users = createMultipleUsers(5);

  // Create task for user
  const task = createTaskData('user-id', { title: 'Custom Task' });

  // Create auth token
  const token = createAccessToken('user-id');
});
```

### Database Helpers

Use database helpers for seeding and cleanup:

```typescript
import { seedUser, seedTask, clearDatabase } from '../helpers/database';

test('example with database', async () => {
  // Seed test data
  const user = await seedUser({
    email: 'test@example.com',
    password: 'SecurePass123!',
    name: 'Test User',
  });

  const task = await seedTask({
    title: 'Test Task',
    userId: user.id,
  });

  // Test code here...

  // Database is automatically cleared in beforeEach hook
});
```

### Authenticated Requests

Test protected endpoints with authentication:

```typescript
import { createAuthenticatedRequest } from '../helpers/request';
import { seedUser } from '../helpers/database';

test('authenticated endpoint', async () => {
  const user = await seedUser({
    email: 'test@example.com',
    password: 'SecurePass123!',
    name: 'Test User',
  });

  const authRequest = createAuthenticatedRequest(app, user.id);

  const response = await authRequest.get('/user/me');

  expect(response.status).toBe(200);
  expect(response.body.email).toBe('test@example.com');
});
```

### Mocking External Services

Mock Redis, Queue, and Logger for unit tests:

```typescript
import { vi } from 'vitest';
import { createMockRedis, createMockQueue, createMockLogger } from '../helpers/mocks';

test('service with mocked dependencies', async () => {
  const mockRedis = createMockRedis();
  const mockQueue = createMockQueue();
  const mockLogger = createMockLogger();

  // Configure mock behavior
  mockRedis.get.mockResolvedValue('cached-value');
  mockQueue.add.mockResolvedValue({ id: 'job-1' });

  // Inject mocks into service
  const service = new MyService(mockRedis, mockQueue, mockLogger);

  await service.doSomething();

  // Verify mock interactions
  expect(mockRedis.get).toHaveBeenCalledWith('cache-key');
  expect(mockQueue.add).toHaveBeenCalledWith('queue-name', expect.any(Object));
});
```

## Test Isolation

- Each test runs in isolation with a clean database state
- Database is reset in `beforeEach` hook (deletes all data)
- Mocks are cleared before each test
- No test should depend on another test's state

## Coverage Requirements

- Minimum 80% statement coverage
- Minimum 70% branch coverage
- Tests fail if coverage drops below threshold
- Coverage reports: `coverage/index.html`

## Best Practices

### DO

✅ Follow AAA pattern (Arrange-Act-Assert)
✅ Use descriptive test names: "should [behavior] when [condition]"
✅ Test both happy paths and error scenarios
✅ Use fixtures for reusable test data
✅ Keep tests independent and isolated
✅ Mock external dependencies (Redis, Queue, APIs)
✅ Clean up resources in `afterEach` if needed

### DON'T

❌ Share mutable state between tests
❌ Rely on test execution order
❌ Mock the system under test
❌ Use real external services (database, Redis)
❌ Write flaky tests (timing-dependent)
❌ Duplicate test data across files

## Writing New Tests

### Integration Test

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { seedUser } from '../helpers/database';
import { createUserData } from '../fixtures/users';

describe('POST /api/example', () => {
  test('should create resource', async () => {
    const user = await seedUser(createUserData());

    const response = await request(app)
      .post('/api/example')
      .set('Authorization', `Bearer ${createAccessToken(user.id)}`)
      .send({ name: 'Example' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Example');
  });
});
```

### Unit Test

```typescript
import { describe, test, expect, vi } from 'vitest';
import { ExampleService } from '@/services/example.service';
import { createMockRedis } from '../helpers/mocks';

describe('ExampleService', () => {
  test('should process data correctly', async () => {
    const mockRedis = createMockRedis();
    const service = new ExampleService(mockRedis);

    const result = await service.process({ value: 10 });

    expect(result).toBe(20);
    expect(mockRedis.set).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Tests Fail with "Database connection error"

- Check that `tests/setup.ts` is properly initializing pg-mem
- Ensure `beforeEach` hook is clearing database state

### Tests Are Slow

- Use mocks for external services (Redis, Queue)
- Avoid unnecessary database operations
- Run specific test files instead of entire suite

### Flaky Tests

- Check for missing `await` keywords
- Verify no shared state between tests
- Use `vi.useFakeTimers()` for time-dependent tests

### Coverage Not Updating

- Run `npm run test:coverage` to regenerate reports
- Clear coverage directory: `rm -rf coverage`
- Check `vitest.config.ts` excludes test files

## CI/CD Integration

Tests run automatically on:
- Every push to main branch
- Every pull request
- Coverage reports uploaded to Codecov

Builds fail if:
- Any test fails
- Coverage drops below 80%

## Performance Targets

- Full test suite: <60 seconds
- Individual integration test: <500ms
- Individual unit test: <50ms

## Additional Resources

- [Vitest Documentation](https://vitest.dev)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [pg-mem Documentation](https://github.com/oguimbal/pg-mem)
