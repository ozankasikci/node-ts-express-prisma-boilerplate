/**
 * Remote Configuration Types
 *
 * Type definitions for the remote configuration management system
 */

import type { SystemConfig, ConfigHistory } from '@prisma/client';

/**
 * Configuration value can be any JSON-serializable type
 */
export type ConfigValue = string | number | boolean | object | unknown[];

/**
 * Standard configuration categories
 * (extensible - users can define custom categories)
 */
export type ConfigCategory =
  | 'database'
  | 'cache'
  | 'email'
  | 'storage'
  | 'feature_flags'
  | 'external_apis'
  | 'monitoring'
  | string;

/**
 * Validation status enumeration
 */
export type ValidationStatus = 'valid' | 'invalid' | 'untested';

/**
 * Configuration action types for history tracking
 */
export type ConfigAction = 'created' | 'updated' | 'deleted' | 'validated';

/**
 * Re-export Prisma-generated types
 */
export type { SystemConfig, ConfigHistory };

/**
 * Request to create a new configuration
 */
export interface CreateConfigRequest {
  category: string;
  key: string;
  value: ConfigValue;
  isSensitive?: boolean;
  isProtected?: boolean;
  enabled?: boolean;
  description?: string;
  createdBy?: string;
}

/**
 * Request to update an existing configuration
 */
export interface UpdateConfigRequest {
  value?: ConfigValue;
  description?: string;
  enabled?: boolean;
  isProtected?: boolean;
  updatedBy?: string;
  reason?: string;
}

/**
 * Configuration response with parsed value
 */
export interface ConfigResponse {
  id: string;
  category: string;
  key: string;
  value: ConfigValue;
  isSensitive: boolean;
  isProtected: boolean;
  enabled: boolean;
  description: string | null;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
  };
  validation: {
    lastValidatedAt: Date | null;
    status: ValidationStatus | null;
    error: string | null;
  };
}

/**
 * History entry response
 */
export interface HistoryResponse {
  id: string;
  configId: string;
  action: ConfigAction;
  previousValue: ConfigValue | null;
  newValue: ConfigValue | null;
  changedAt: Date;
  changedBy: string | null;
  reason: string | null;
}

/**
 * Paginated history response
 */
export interface PaginatedHistoryResponse {
  items: HistoryResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Query parameters for listing configurations
 */
export interface ListConfigsQuery {
  category?: string;
  enabled?: boolean;
  includeDisabled?: boolean;
}

/**
 * Query parameters for history retrieval
 */
export interface GetHistoryQuery {
  limit?: number;
  offset?: number;
}

/**
 * Migration mapping definition
 */
export interface MigrationMapping {
  envVar: string;
  category: string;
  key: string;
  isSensitive?: boolean;
  isProtected?: boolean;
  description?: string;
}

/**
 * Migration request
 */
export interface MigrateRequest {
  dryRun: boolean;
  mappings: MigrationMapping[];
}

/**
 * Migration result detail
 */
export interface MigrationDetail {
  envVar: string;
  category: string;
  key: string;
  status: 'migrated' | 'skipped' | 'failed';
  reason?: string;
}

/**
 * Migration response
 */
export interface MigrateResponse {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  failedCount: number;
  details: MigrationDetail[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  status: ValidationStatus;
  error: string | null;
}

/**
 * Internal configuration with decrypted value
 * (used within service layer, not exposed via API)
 */
export interface DecodedConfig {
  id: string;
  category: string;
  key: string;
  value: ConfigValue;
  isSensitive: boolean;
  isProtected: boolean;
  enabled: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  lastValidatedAt: Date | null;
  validationStatus: ValidationStatus | null;
  validationError: string | null;
}
