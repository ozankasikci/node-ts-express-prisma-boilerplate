/**
 * Remote Configuration Repository
 *
 * Database access layer for configuration operations using Prisma
 */

import { prisma } from '../../lib/db.js';
import type { SystemConfig, ConfigHistory } from '@prisma/client';
import type { CreateConfigRequest } from './remote-config.types.js';
import { logger } from '../../lib/logger.js';

/**
 * Create a new configuration entry
 */
export async function create(data: CreateConfigRequest): Promise<SystemConfig> {
  try {
    return await prisma.systemConfig.create({
      data: {
        category: data.category,
        key: data.key,
        value: data.value as string, // Value should already be serialized
        isSensitive: data.isSensitive ?? false,
        isProtected: data.isProtected ?? false,
        enabled: data.enabled ?? true,
        description: data.description ?? null,
        createdBy: data.createdBy ?? null,
        updatedBy: data.createdBy ?? null,
      },
    });
  } catch (error) {
    logger.error({ error, category: data.category, key: data.key }, 'Failed to create configuration');
    throw error;
  }
}

/**
 * Find configuration by ID
 */
export async function findById(id: string): Promise<SystemConfig | null> {
  try {
    return await prisma.systemConfig.findUnique({
      where: { id },
    });
  } catch (error) {
    logger.error({ error, id }, 'Failed to find configuration by ID');
    throw error;
  }
}

/**
 * Find configuration by category and key
 */
export async function findByCategoryAndKey(category: string, key: string): Promise<SystemConfig | null> {
  try {
    return await prisma.systemConfig.findUnique({
      where: {
        category_key: {
          category,
          key,
        },
      },
    });
  } catch (error) {
    logger.error({ error, category, key }, 'Failed to find configuration by category and key');
    throw error;
  }
}

/**
 * Find multiple configurations with optional filtering
 */
export async function findMany(filters?: {
  category?: string;
  enabled?: boolean;
  includeDisabled?: boolean;
}): Promise<SystemConfig[]> {
  try {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    // Handle enabled filtering
    if (filters?.enabled !== undefined) {
      where.enabled = filters.enabled;
    } else if (!filters?.includeDisabled) {
      // By default, only return enabled configurations
      where.enabled = true;
    }

    return await prisma.systemConfig.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    logger.error({ error, filters }, 'Failed to find configurations');
    throw error;
  }
}

/**
 * Update an existing configuration
 */
export async function update(
  id: string,
  data: {
    value?: string;
    description?: string | null;
    enabled?: boolean;
    isProtected?: boolean;
    updatedBy?: string | null;
  }
): Promise<SystemConfig> {
  try {
    return await prisma.systemConfig.update({
      where: { id },
      data: {
        ...data,
        // Reset validation status when value changes
        ...(data.value !== undefined && {
          validationStatus: null,
          validationError: null,
          lastValidatedAt: null,
        }),
      },
    });
  } catch (error) {
    logger.error({ error, id }, 'Failed to update configuration');
    throw error;
  }
}

/**
 * Delete a configuration
 * Throws error if configuration is protected
 */
export async function deleteConfig(id: string): Promise<void> {
  try {
    // First check if configuration is protected
    const config = await findById(id);
    if (!config) {
      throw new Error(`Configuration with ID ${id} not found`);
    }

    if (config.isProtected) {
      throw new Error('Cannot delete protected configuration');
    }

    await prisma.systemConfig.delete({
      where: { id },
    });
  } catch (error) {
    logger.error({ error, id }, 'Failed to delete configuration');
    throw error;
  }
}

/**
 * Record a history entry for configuration changes
 */
export async function recordHistory(data: {
  configId: string;
  action: 'created' | 'updated' | 'deleted' | 'validated';
  previousValue?: string | null;
  newValue?: string | null;
  changedBy?: string | null;
  reason?: string | null;
}): Promise<ConfigHistory> {
  try {
    return await prisma.configHistory.create({
      data: {
        configId: data.configId,
        action: data.action,
        previousValue: data.previousValue ?? null,
        newValue: data.newValue ?? null,
        changedBy: data.changedBy ?? null,
        reason: data.reason ?? null,
      },
    });
  } catch (error) {
    logger.error({ error, configId: data.configId }, 'Failed to record configuration history');
    throw error;
  }
}

/**
 * Get history for a specific configuration
 */
export async function getHistory(
  configId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ items: ConfigHistory[]; total: number }> {
  try {
    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const [items, total] = await Promise.all([
      prisma.configHistory.findMany({
        where: { configId },
        orderBy: { changedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.configHistory.count({
        where: { configId },
      }),
    ]);

    return { items, total };
  } catch (error) {
    logger.error({ error, configId }, 'Failed to get configuration history');
    throw error;
  }
}

/**
 * Update validation status for a configuration
 */
export async function updateValidation(
  id: string,
  status: 'valid' | 'invalid' | 'untested',
  error: string | null = null
): Promise<SystemConfig> {
  try {
    return await prisma.systemConfig.update({
      where: { id },
      data: {
        validationStatus: status,
        validationError: error,
        lastValidatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error({ error, id }, 'Failed to update validation status');
    throw error;
  }
}
