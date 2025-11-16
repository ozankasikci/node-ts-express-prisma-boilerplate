/**
 * Remote Configuration Validation Schemas
 *
 * Zod schemas for validating configuration requests and data
 */

import { z } from 'zod';

/**
 * Category naming pattern: lowercase alphanumeric with underscores, starts with letter
 * Max 50 characters
 */
const CATEGORY_PATTERN = /^[a-z][a-z0-9_]*$/;
const CATEGORY_MAX_LENGTH = 50;

/**
 * Key naming pattern: lowercase alphanumeric with underscores, starts with letter
 * Max 100 characters
 */
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const KEY_MAX_LENGTH = 100;

/**
 * Max value size: 10KB (10,240 bytes)
 */
const MAX_VALUE_SIZE_BYTES = 10 * 1024;

/**
 * Sensitive key name patterns (auto-detection)
 */
const SENSITIVE_KEY_PATTERNS = ['key', 'secret', 'password', 'token', 'credential', 'private'];

/**
 * Check if a key name suggests it contains sensitive data
 */
export function isSensitiveKeyName(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern));
}

/**
 * Validation status enum
 */
export const validationStatusSchema = z.enum(['valid', 'invalid', 'untested']).nullable();

/**
 * Config action enum
 */
export const configActionSchema = z.enum(['created', 'updated', 'deleted', 'validated']);

/**
 * Category validation schema
 */
export const categorySchema = z
  .string()
  .min(1, 'Category is required')
  .max(CATEGORY_MAX_LENGTH, `Category must be at most ${CATEGORY_MAX_LENGTH} characters`)
  .regex(CATEGORY_PATTERN, 'Category must be lowercase alphanumeric with underscores, starting with a letter');

/**
 * Key validation schema
 */
export const keySchema = z
  .string()
  .min(1, 'Key is required')
  .max(KEY_MAX_LENGTH, `Key must be at most ${KEY_MAX_LENGTH} characters`)
  .regex(KEY_PATTERN, 'Key must be lowercase alphanumeric with underscores, starting with a letter');

/**
 * Configuration value schema
 * Validates that JSON-serialized value is within size limit
 */
export const configValueSchema = z.unknown().refine(
  (value) => {
    const jsonString = JSON.stringify(value);
    return jsonString.length <= MAX_VALUE_SIZE_BYTES;
  },
  {
    message: `Configuration value must be at most ${MAX_VALUE_SIZE_BYTES} bytes when JSON-encoded`,
  }
);

/**
 * Create configuration request schema
 */
export const createConfigSchema = z.object({
  category: categorySchema,
  key: keySchema,
  value: configValueSchema,
  isSensitive: z.boolean().optional().default(false),
  isProtected: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true),
  description: z.string().max(1000).optional(),
  createdBy: z.string().max(255).optional(),
});

/**
 * Update configuration request schema
 */
export const updateConfigSchema = z.object({
  value: configValueSchema.optional(),
  description: z.string().max(1000).optional().nullable(),
  enabled: z.boolean().optional(),
  isProtected: z.boolean().optional(),
  updatedBy: z.string().max(255).optional(),
  reason: z.string().max(500).optional(),
});

/**
 * List configurations query schema
 */
export const listConfigsQuerySchema = z.object({
  category: categorySchema.optional(),
  enabled: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  includeDisabled: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Get history query schema
 */
export const getHistoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0)),
});

/**
 * Migration mapping schema
 */
export const migrationMappingSchema = z.object({
  envVar: z.string().min(1, 'Environment variable name is required'),
  category: categorySchema,
  key: keySchema,
  isSensitive: z.boolean().optional().default(false),
  isProtected: z.boolean().optional().default(false),
  description: z.string().max(1000).optional(),
});

/**
 * Migration request schema
 */
export const migrateRequestSchema = z.object({
  dryRun: z.boolean(),
  mappings: z.array(migrationMappingSchema).min(1, 'At least one mapping is required'),
});

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid configuration ID format');

/**
 * Type exports for request validation
 */
export type CreateConfigInput = z.infer<typeof createConfigSchema>;
export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
export type ListConfigsQueryInput = z.infer<typeof listConfigsQuerySchema>;
export type GetHistoryQueryInput = z.infer<typeof getHistoryQuerySchema>;
export type MigrationMappingInput = z.infer<typeof migrationMappingSchema>;
export type MigrateRequestInput = z.infer<typeof migrateRequestSchema>;
