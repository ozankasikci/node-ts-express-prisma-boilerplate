import { sign } from 'jsonwebtoken';

/**
 * Auth Token Test Fixtures
 * Provides factory functions for creating JWT tokens for testing
 */

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Create valid JWT access token
 */
export function createAccessToken(userId: string, expiresIn = '1h'): string {
  return sign({ userId }, JWT_SECRET, { expiresIn });
}

/**
 * Create valid JWT refresh token
 */
export function createRefreshToken(userId: string, expiresIn = '7d'): string {
  return sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn });
}

/**
 * Create expired JWT token
 */
export function createExpiredToken(userId: string): string {
  return sign({ userId }, JWT_SECRET, { expiresIn: '-1h' });
}

/**
 * Create JWT token with custom claims
 */
export function createTokenWithClaims(claims: Record<string, any>, expiresIn = '1h'): string {
  return sign(claims, JWT_SECRET, { expiresIn });
}

/**
 * Create malformed JWT token
 */
export function createMalformedToken(): string {
  return 'malformed.token';
}

/**
 * Create JWT token with invalid signature
 */
export function createTokenWithInvalidSignature(userId: string): string {
  return sign({ userId }, 'wrong-secret', { expiresIn: '1h' });
}

/**
 * Create JWT token with tampered payload
 */
export function createTamperedToken(userId: string): string {
  const validToken = createAccessToken(userId);
  const [header, payload, signature] = validToken.split('.');

  // Tamper with the payload
  const tamperedPayload = Buffer.from(
    JSON.stringify({ userId: 'tampered-user-id' })
  ).toString('base64url');

  return `${header}.${tamperedPayload}.${signature}`;
}

/**
 * Create auth headers with Bearer token
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Create auth headers with custom scheme
 */
export function createCustomAuthHeaders(token: string, scheme = 'Basic'): Record<string, string> {
  return {
    Authorization: `${scheme} ${token}`,
  };
}

/**
 * Create registration request data
 */
export function createRegistrationData(overrides?: {
  email?: string;
  password?: string;
  name?: string;
}) {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    name: 'Test User',
    ...overrides,
  };
}

/**
 * Create login request data
 */
export function createLoginData(overrides?: { email?: string; password?: string }) {
  return {
    email: 'test@example.com',
    password: 'SecurePass123!',
    ...overrides,
  };
}
