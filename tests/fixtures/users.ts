/**
 * User Test Fixtures
 * Provides factory functions for creating test user data
 */

export interface UserFixture {
  id?: string;
  email: string;
  password: string;
  name: string;
}

/**
 * Create default test user data
 */
export function createUserData(overrides?: Partial<UserFixture>): UserFixture {
  return {
    email: 'test@example.com',
    password: 'SecurePass123!',
    name: 'Test User',
    ...overrides,
  };
}

/**
 * Create multiple test users with unique emails
 */
export function createMultipleUsers(count: number): UserFixture[] {
  return Array.from({ length: count }, (_, i) => ({
    email: `test${i + 1}@example.com`,
    password: 'SecurePass123!',
    name: `Test User ${i + 1}`,
  }));
}

/**
 * Create user with invalid email
 */
export function createUserWithInvalidEmail(): Partial<UserFixture> {
  return {
    email: 'invalid-email',
    password: 'SecurePass123!',
    name: 'Test User',
  };
}

/**
 * Create user with short password
 */
export function createUserWithShortPassword(): UserFixture {
  return {
    email: 'test@example.com',
    password: '123',
    name: 'Test User',
  };
}

/**
 * Create user with missing fields
 */
export function createUserWithMissingFields(): Partial<UserFixture> {
  return {
    email: 'test@example.com',
    // Missing password and name
  };
}

/**
 * Create admin user data
 */
export function createAdminUserData(overrides?: Partial<UserFixture>): UserFixture {
  return {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    name: 'Admin User',
    ...overrides,
  };
}

/**
 * Create user for registration testing
 */
export function createRegistrationData(overrides?: Partial<UserFixture>): Omit<UserFixture, 'id'> {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    name: 'New User',
    ...overrides,
  };
}

/**
 * Create login credentials
 */
export function createLoginCredentials(overrides?: { email?: string; password?: string }) {
  return {
    email: 'test@example.com',
    password: 'SecurePass123!',
    ...overrides,
  };
}
