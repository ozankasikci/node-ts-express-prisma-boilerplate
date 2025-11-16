/**
 * Unit tests for encryption utilities
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, maskSensitiveValue, validateEncryptionKey } from '../../src/lib/crypto.js';

describe('Crypto utilities', () => {
  beforeAll(() => {
    // Ensure encryption key is set
    expect(process.env.CONFIG_ENCRYPTION_KEY).toBeDefined();
  });

  describe('validateEncryptionKey', () => {
    it('should validate the encryption key without throwing', () => {
      expect(() => validateEncryptionKey()).not.toThrow();
    });
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'my-secret-password';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt complex strings with special characters', () => {
      const plaintext = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
    });

    it('should encrypt empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
    });

    it('should encrypt unicode characters', () => {
      const plaintext = '密码🔐🔑';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted value back to original plaintext', () => {
      const plaintext = 'my-secret-value';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string encryption/decryption', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(5000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界🌍';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle JSON strings', () => {
      const plaintext = JSON.stringify({ apiKey: 'secret123', userId: 456 });
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(JSON.parse(decrypted)).toEqual({ apiKey: 'secret123', userId: 456 });
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => decrypt('invalid-base64-data')).toThrow();
    });

    it('should throw error for tampered data', () => {
      const plaintext = 'secret';
      const encrypted = encrypt(plaintext);
      // Tamper with the encrypted data
      const tampered = encrypted.slice(0, -5) + 'XXXXX';

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('maskSensitiveValue', () => {
    it('should mask short values (6 chars or less) completely', () => {
      expect(maskSensitiveValue('abc')).toBe('****');
      expect(maskSensitiveValue('secret')).toBe('****');
    });

    it('should partially mask medium-length values (7-12 chars)', () => {
      const masked = maskSensitiveValue('secret123');
      expect(masked).toContain('***');
      expect(masked.length).toBeLessThan('secret123'.length);
      // Should show some characters
      expect(masked).toMatch(/^[a-z0-9].*\*\*\*.*[a-z0-9]$/);
    });

    it('should show first 3 and last 3 chars for long values', () => {
      const value = 'sk_live_1234567890abcdef';
      const masked = maskSensitiveValue(value);

      expect(masked).toBe('sk_***def');
    });

    it('should handle API key format', () => {
      const apiKey = 'sk_live_abcdefghijklmnop';
      const masked = maskSensitiveValue(apiKey);

      expect(masked).toContain('***');
      expect(masked.startsWith('sk_')).toBe(true);
      expect(masked.endsWith('nop')).toBe(true);
    });

    it('should handle empty string', () => {
      expect(maskSensitiveValue('')).toBe('****');
    });

    it('should handle single character', () => {
      expect(maskSensitiveValue('a')).toBe('****');
    });

    it('should preserve format while masking', () => {
      const password = 'MySecurePassword123';
      const masked = maskSensitiveValue(password);

      expect(masked).toContain('***');
      expect(masked.length).toBeLessThan(password.length);
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    const testCases = [
      'simple',
      'with spaces',
      'with-dashes',
      'with_underscores',
      'with.dots',
      'with/slashes',
      'with@symbols',
      '12345678',
      'MixedCase123',
      '',
      'a',
      'A'.repeat(1000),
      JSON.stringify({ key: 'value', nested: { data: 123 } }),
    ];

    testCases.forEach((testCase) => {
      it(`should successfully round-trip: "${testCase.substring(0, 30)}${testCase.length > 30 ? '...' : ''}"`, () => {
        const encrypted = encrypt(testCase);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
