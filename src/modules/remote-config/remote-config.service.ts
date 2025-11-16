/**
 * Remote Configuration Service
 *
 * Business logic layer for configuration management
 */

import * as repository from './remote-config.repository.js';
import { encrypt, decrypt, maskSensitiveValue } from '../../lib/crypto.js';
import { logger } from '../../lib/logger.js';
import {
  configOperationsTotal,
  configEncryptionOperationsTotal,
  configValidationTotal,
} from '../../lib/metrics.js';
import type {
  ConfigValue,
  CreateConfigRequest,
  UpdateConfigRequest,
  ConfigResponse,
  ListConfigsQuery,
  ValidationResult,
  MigrateRequest,
  MigrateResponse,
  MigrationDetail,
  HistoryResponse,
  PaginatedHistoryResponse,
} from './remote-config.types.js';
import { isSensitiveKeyName } from './remote-config.schemas.js';
import type { SystemConfig } from '@prisma/client';

/**
 * Serialize a value for storage
 * Converts JavaScript value to JSON string
 */
function serializeValue(value: ConfigValue): string {
  return JSON.stringify(value);
}

/**
 * Deserialize a value from storage
 * Converts JSON string back to JavaScript value
 */
function deserializeValue(value: string): ConfigValue {
  try {
    return JSON.parse(value);
  } catch (error) {
    // If not valid JSON, return as string
    logger.warn({ value: value.substring(0, 50) }, 'Failed to deserialize config value, returning as string');
    return value;
  }
}

/**
 * Convert database entity to API response format
 */
function toResponse(config: SystemConfig, includeValue: boolean = true): ConfigResponse {
  let value: ConfigValue = deserializeValue(config.value);

  // Decrypt if sensitive
  if (config.isSensitive && includeValue) {
    try {
      const decrypted = decrypt(config.value);
      value = deserializeValue(decrypted);
      configEncryptionOperationsTotal.inc({ operation: 'decrypt', status: 'success' });
    } catch (error) {
      logger.error({ error, configId: config.id }, 'Failed to decrypt sensitive value');
      configEncryptionOperationsTotal.inc({ operation: 'decrypt', status: 'failure' });
      throw new Error('Failed to decrypt configuration value');
    }
  }

  // Mask sensitive values in response
  if (config.isSensitive && typeof value === 'string') {
    value = maskSensitiveValue(value);
  }

  return {
    id: config.id,
    category: config.category,
    key: config.key,
    value,
    isSensitive: config.isSensitive,
    isProtected: config.isProtected,
    enabled: config.enabled,
    description: config.description,
    metadata: {
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      createdBy: config.createdBy,
      updatedBy: config.updatedBy,
    },
    validation: {
      lastValidatedAt: config.lastValidatedAt,
      status: config.validationStatus as any,
      error: config.validationError,
    },
  };
}

/**
 * Create a new configuration
 */
export async function create(data: CreateConfigRequest): Promise<ConfigResponse> {
  try {
    // Auto-detect sensitive keys if not explicitly set
    const isSensitive = data.isSensitive ?? isSensitiveKeyName(data.key);

    // Serialize value
    let serializedValue = serializeValue(data.value);

    // Encrypt if sensitive
    if (isSensitive) {
      try {
        serializedValue = encrypt(serializedValue);
        configEncryptionOperationsTotal.inc({ operation: 'encrypt', status: 'success' });
      } catch (error) {
        logger.error({ error, category: data.category, key: data.key }, 'Failed to encrypt sensitive value');
        configEncryptionOperationsTotal.inc({ operation: 'encrypt', status: 'failure' });
        throw new Error('Failed to encrypt configuration value');
      }
    }

    // Create configuration
    const config = await repository.create({
      ...data,
      value: serializedValue,
      isSensitive,
    });

    // Record history
    await repository.recordHistory({
      configId: config.id,
      action: 'created',
      newValue: config.value,
      changedBy: data.createdBy,
    });

    configOperationsTotal.inc({ operation: 'create', status: 'success' });
    logger.info({ configId: config.id, category: data.category, key: data.key }, 'Configuration created');

    return toResponse(config);
  } catch (error) {
    configOperationsTotal.inc({ operation: 'create', status: 'failure' });
    logger.error({ error, category: data.category, key: data.key }, 'Failed to create configuration');
    throw error;
  }
}

/**
 * Get configuration by ID
 */
export async function getById(id: string): Promise<ConfigResponse | null> {
  try {
    const config = await repository.findById(id);
    if (!config) {
      return null;
    }

    configOperationsTotal.inc({ operation: 'read', status: 'success' });
    return toResponse(config);
  } catch (error) {
    configOperationsTotal.inc({ operation: 'read', status: 'failure' });
    logger.error({ error, id }, 'Failed to get configuration by ID');
    throw error;
  }
}

/**
 * Get configuration by category and key
 */
export async function getByCategoryAndKey(category: string, key: string): Promise<ConfigResponse | null> {
  try {
    const config = await repository.findByCategoryAndKey(category, key);
    if (!config) {
      // Try environment variable fallback
      const envValue = getFromEnvironment(category, key);
      if (envValue !== null) {
        logger.debug({ category, key }, 'Configuration retrieved from environment variable');
        // Return a synthetic response for env var
        return {
          id: 'env-var',
          category,
          key,
          value: envValue,
          isSensitive: false,
          isProtected: false,
          enabled: true,
          description: 'Value from environment variable',
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null,
            updatedBy: null,
          },
          validation: {
            lastValidatedAt: null,
            status: null,
            error: null,
          },
        };
      }
      return null;
    }

    configOperationsTotal.inc({ operation: 'read', status: 'success' });
    return toResponse(config);
  } catch (error) {
    configOperationsTotal.inc({ operation: 'read', status: 'failure' });
    logger.error({ error, category, key }, 'Failed to get configuration by category and key');
    throw error;
  }
}

/**
 * Get all configurations with optional filtering
 */
export async function getAll(query?: ListConfigsQuery): Promise<ConfigResponse[]> {
  try {
    const configs = await repository.findMany({
      category: query?.category,
      enabled: query?.enabled,
      includeDisabled: query?.includeDisabled,
    });

    configOperationsTotal.inc({ operation: 'list', status: 'success' });
    return configs.map((config) => toResponse(config));
  } catch (error) {
    configOperationsTotal.inc({ operation: 'list', status: 'failure' });
    logger.error({ error, query }, 'Failed to get configurations');
    throw error;
  }
}

/**
 * Update an existing configuration
 */
export async function update(id: string, data: UpdateConfigRequest): Promise<ConfigResponse> {
  try {
    // Get current configuration
    const currentConfig = await repository.findById(id);
    if (!currentConfig) {
      throw new Error(`Configuration with ID ${id} not found`);
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: data.updatedBy,
    };

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.enabled !== undefined) {
      updateData.enabled = data.enabled;
    }

    if (data.isProtected !== undefined) {
      updateData.isProtected = data.isProtected;
    }

    // Handle value update with encryption if needed
    if (data.value !== undefined) {
      let serializedValue = serializeValue(data.value);

      if (currentConfig.isSensitive) {
        try {
          serializedValue = encrypt(serializedValue);
          configEncryptionOperationsTotal.inc({ operation: 'encrypt', status: 'success' });
        } catch (error) {
          logger.error({ error, configId: id }, 'Failed to encrypt updated value');
          configEncryptionOperationsTotal.inc({ operation: 'encrypt', status: 'failure' });
          throw new Error('Failed to encrypt configuration value');
        }
      }

      updateData.value = serializedValue;
    }

    // Update configuration
    const updatedConfig = await repository.update(id, updateData);

    // Record history
    await repository.recordHistory({
      configId: id,
      action: 'updated',
      previousValue: currentConfig.value,
      newValue: updatedConfig.value,
      changedBy: data.updatedBy,
      reason: data.reason,
    });

    configOperationsTotal.inc({ operation: 'update', status: 'success' });
    logger.info({ configId: id }, 'Configuration updated');

    return toResponse(updatedConfig);
  } catch (error) {
    configOperationsTotal.inc({ operation: 'update', status: 'failure' });
    logger.error({ error, id }, 'Failed to update configuration');
    throw error;
  }
}

/**
 * Delete a configuration
 */
export async function deleteConfig(id: string, deletedBy?: string): Promise<void> {
  try {
    // Get configuration before deletion for history
    const config = await repository.findById(id);
    if (!config) {
      throw new Error(`Configuration with ID ${id} not found`);
    }

    // Record history before deletion
    await repository.recordHistory({
      configId: id,
      action: 'deleted',
      previousValue: config.value,
      changedBy: deletedBy,
    });

    // Delete configuration (will cascade delete history)
    await repository.deleteConfig(id);

    configOperationsTotal.inc({ operation: 'delete', status: 'success' });
    logger.info({ configId: id }, 'Configuration deleted');
  } catch (error) {
    configOperationsTotal.inc({ operation: 'delete', status: 'failure' });
    logger.error({ error, id }, 'Failed to delete configuration');
    throw error;
  }
}

/**
 * Get configuration change history
 */
export async function getHistory(
  id: string,
  options?: { limit?: number; offset?: number }
): Promise<PaginatedHistoryResponse> {
  try {
    const { items, total } = await repository.getHistory(id, options);

    const historyItems: HistoryResponse[] = items.map((item) => ({
      id: item.id,
      configId: item.configId,
      action: item.action as any,
      previousValue: item.previousValue ? deserializeValue(item.previousValue) : null,
      newValue: item.newValue ? deserializeValue(item.newValue) : null,
      changedAt: item.changedAt,
      changedBy: item.changedBy,
      reason: item.reason,
    }));

    return {
      items: historyItems,
      total,
      limit: options?.limit ?? 10,
      offset: options?.offset ?? 0,
    };
  } catch (error) {
    logger.error({ error, id }, 'Failed to get configuration history');
    throw error;
  }
}

/**
 * Validate a configuration value
 */
export async function validate(id: string): Promise<ValidationResult> {
  try {
    const config = await repository.findById(id);
    if (!config) {
      throw new Error(`Configuration with ID ${id} not found`);
    }

    // Basic validation: check if value can be deserialized
    let valid = true;
    let error: string | null = null;

    try {
      deserializeValue(config.value);
    } catch {
      valid = false;
      error = 'Invalid JSON format';
    }

    const status = valid ? 'valid' : 'invalid';

    // Update validation status
    await repository.updateValidation(id, status, error);

    // Record history
    await repository.recordHistory({
      configId: id,
      action: 'validated',
    });

    configValidationTotal.inc({ status });
    logger.info({ configId: id, status }, 'Configuration validated');

    return { valid, status, error };
  } catch (error) {
    logger.error({ error, id }, 'Failed to validate configuration');
    throw error;
  }
}

/**
 * Migrate environment variables to database
 */
export async function migrate(request: MigrateRequest): Promise<MigrateResponse> {
  const details: MigrationDetail[] = [];
  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of request.mappings) {
    try {
      // Check if environment variable exists
      const envValue = process.env[mapping.envVar];
      if (!envValue) {
        details.push({
          envVar: mapping.envVar,
          category: mapping.category,
          key: mapping.key,
          status: 'skipped',
          reason: 'Environment variable not set',
        });
        skippedCount++;
        continue;
      }

      // Check if configuration already exists
      const existing = await repository.findByCategoryAndKey(mapping.category, mapping.key);
      if (existing) {
        details.push({
          envVar: mapping.envVar,
          category: mapping.category,
          key: mapping.key,
          status: 'skipped',
          reason: 'Configuration already exists in database',
        });
        skippedCount++;
        continue;
      }

      // If dry run, don't actually create
      if (request.dryRun) {
        details.push({
          envVar: mapping.envVar,
          category: mapping.category,
          key: mapping.key,
          status: 'migrated',
          reason: 'Dry run - would be migrated',
        });
        migratedCount++;
        continue;
      }

      // Parse env value (try JSON first, fallback to string)
      let parsedValue: ConfigValue = envValue;
      try {
        parsedValue = JSON.parse(envValue);
      } catch {
        // Not JSON, use as string
      }

      // Create configuration
      await create({
        category: mapping.category,
        key: mapping.key,
        value: parsedValue,
        isSensitive: mapping.isSensitive,
        isProtected: mapping.isProtected,
        description: mapping.description ?? `Migrated from ${mapping.envVar}`,
        createdBy: 'migration',
      });

      details.push({
        envVar: mapping.envVar,
        category: mapping.category,
        key: mapping.key,
        status: 'migrated',
      });
      migratedCount++;
    } catch (error) {
      logger.error({ error, mapping }, 'Failed to migrate environment variable');
      details.push({
        envVar: mapping.envVar,
        category: mapping.category,
        key: mapping.key,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
      failedCount++;
    }
  }

  return {
    success: failedCount === 0,
    migratedCount,
    skippedCount,
    failedCount,
    details,
  };
}

/**
 * Get value from environment variable (used internally and by config-service)
 */
export function getFromEnvironment(category: string, key: string): ConfigValue | null {
  // Pattern 1: CATEGORY_KEY
  const pattern1 = `${category.toUpperCase()}_${key.toUpperCase()}`;
  if (process.env[pattern1]) {
    return parseEnvValue(process.env[pattern1]!);
  }

  // Pattern 2: KEY only
  const pattern2 = key.toUpperCase();
  if (process.env[pattern2]) {
    return parseEnvValue(process.env[pattern2]!);
  }

  return null;
}

/**
 * Parse environment variable value to appropriate type
 */
function parseEnvValue(value: string): ConfigValue {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
