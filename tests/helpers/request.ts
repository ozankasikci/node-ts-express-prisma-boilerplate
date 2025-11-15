import request from 'supertest';
import { sign } from 'jsonwebtoken';

/**
 * Create authenticated request with JWT token
 */
export function createAuthenticatedRequest(app: any, userId: string) {
  const token = sign({ userId }, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '1h',
  });

  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

/**
 * Create request with custom headers
 */
export function createRequestWithHeaders(app: any, headers: Record<string, string>) {
  return {
    get: (url: string) => request(app).get(url).set(headers),
    post: (url: string) => request(app).post(url).set(headers),
    patch: (url: string) => request(app).patch(url).set(headers),
    put: (url: string) => request(app).put(url).set(headers),
    delete: (url: string) => request(app).delete(url).set(headers),
  };
}

/**
 * Create expired JWT token for testing authentication failures
 */
export function createExpiredToken(userId: string): string {
  return sign({ userId }, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '-1h', // Already expired
  });
}

/**
 * Create invalid JWT token for testing authentication failures
 */
export function createInvalidToken(): string {
  return 'invalid.token.here';
}

/**
 * Create malformed JWT token (missing parts)
 */
export function createMalformedToken(): string {
  return 'malformed.token';
}

/**
 * Generate test correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
