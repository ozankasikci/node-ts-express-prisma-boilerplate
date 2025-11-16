import crypto from 'node:crypto';
import { logger } from './logger.js';

/**
 * Encryption algorithm configuration
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits for AES-256

/**
 * Get and validate encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.CONFIG_ENCRYPTION_KEY;

  if (!keyString) {
    throw new Error(
      'CONFIG_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  try {
    const key = Buffer.from(keyString, 'base64');

    if (key.length !== KEY_LENGTH) {
      throw new Error(
        `Invalid encryption key length: ${key.length} bytes. Expected ${KEY_LENGTH} bytes (256 bits).`
      );
    }

    return key;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid encryption key length')) {
      throw error;
    }
    throw new Error(
      'Invalid CONFIG_ENCRYPTION_KEY format. Must be a base64-encoded 32-byte key. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }
}

/**
 * Encrypts a value using AES-256-GCM
 *
 * @param plaintext - The value to encrypt
 * @returns Base64-encoded encrypted data (IV + AuthTag + Ciphertext)
 *
 * Format: Base64(IV || AuthTag || Ciphertext)
 * - IV: 16 bytes (randomly generated)
 * - AuthTag: 16 bytes (GCM authentication tag)
 * - Ciphertext: Variable length
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine IV + AuthTag + Ciphertext and encode as base64
    const combined = Buffer.concat([iv, authTag, Buffer.from(ciphertext, 'base64')]);

    return combined.toString('base64');
  } catch (error) {
    logger.error({ error }, 'Encryption failed');
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypts a value encrypted with AES-256-GCM
 *
 * @param encryptedData - Base64-encoded encrypted data (IV + AuthTag + Ciphertext)
 * @returns Decrypted plaintext value
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract IV, AuthTag, and Ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, undefined, 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    logger.error({ error }, 'Decryption failed');
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Masks a sensitive value for display purposes
 *
 * Returns a masked version showing only the first and last few characters
 *
 * @param value - The sensitive value to mask
 * @returns Masked string (e.g., "abc...xyz" or "****" for short values)
 *
 * Examples:
 * - "secret123" -> "sec***123"
 * - "sk_live_abc123xyz" -> "sk_***xyz"
 * - "short" -> "****"
 */
export function maskSensitiveValue(value: string): string {
  if (value.length <= 6) {
    return '****';
  }

  if (value.length <= 12) {
    const visibleChars = Math.floor(value.length / 4);
    return value.substring(0, visibleChars) + '***' + value.substring(value.length - visibleChars);
  }

  // For longer values, show first 3 and last 3 characters
  return value.substring(0, 3) + '***' + value.substring(value.length - 3);
}

/**
 * Validates the encryption key on application startup
 * @throws Error if key is invalid or missing
 */
export function validateEncryptionKey(): void {
  try {
    getEncryptionKey();
    logger.info('Encryption key validated successfully');
  } catch (error) {
    logger.error({ error }, 'Encryption key validation failed');
    throw error;
  }
}
