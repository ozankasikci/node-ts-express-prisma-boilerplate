/**
 * Remote Configuration Controller
 *
 * HTTP request/response handling for configuration API
 */

import type { Request, Response } from 'express';
import * as service from './remote-config.service.js';
import {
  createConfigSchema,
  updateConfigSchema,
  listConfigsQuerySchema,
  getHistoryQuerySchema,
  migrateRequestSchema,
  uuidSchema,
} from './remote-config.schemas.js';
import { logger } from '../../lib/logger.js';

/**
 * Create a new configuration
 * POST /api/remote-config
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = createConfigSchema.parse(req.body) as any;
    const config = await service.create(validatedData);

    res.status(201).json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error({ error }, 'Create configuration failed');

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        error: 'Configuration with this category and key already exists',
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create configuration',
    });
  }
}

/**
 * Get all configurations with optional filtering
 * GET /api/remote-config
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const query = listConfigsQuerySchema.parse(req.query);
    const configs = await service.getAll(query);

    res.status(200).json({
      success: true,
      data: configs,
      count: configs.length,
    });
  } catch (error) {
    logger.error({ error }, 'Get all configurations failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve configurations',
    });
  }
}

/**
 * Get configuration by ID
 * GET /api/remote-config/:id
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = uuidSchema.parse(req.params.id);
    const config = await service.getById(id);

    if (!config) {
      res.status(404).json({
        success: false,
        error: 'Configuration not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error({ error }, 'Get configuration by ID failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve configuration',
    });
  }
}

/**
 * Get configuration by category and key
 * GET /api/remote-config/category/:category/key/:key
 */
export async function getByCategoryAndKey(req: Request, res: Response): Promise<void> {
  try {
    const { category, key } = req.params;
    const config = await service.getByCategoryAndKey(category, key);

    if (!config) {
      res.status(404).json({
        success: false,
        error: `Configuration not found for category "${category}" and key "${key}"`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error({ error }, 'Get configuration by category and key failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve configuration',
    });
  }
}

/**
 * Update an existing configuration
 * PUT /api/remote-config/:id
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = uuidSchema.parse(req.params.id);
    const validatedData = updateConfigSchema.parse(req.body) as any;
    const config = await service.update(id, validatedData);

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error({ error }, 'Update configuration failed');

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Configuration not found',
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update configuration',
    });
  }
}

/**
 * Delete a configuration
 * DELETE /api/remote-config/:id
 */
export async function deleteConfig(req: Request, res: Response): Promise<void> {
  try {
    const id = uuidSchema.parse(req.params.id);
    await service.deleteConfig(id);

    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Delete configuration failed');

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Configuration not found',
      });
      return;
    }

    if (error instanceof Error && error.message.includes('protected')) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete protected configuration',
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete configuration',
    });
  }
}

/**
 * Get configuration change history
 * GET /api/remote-config/:id/history
 */
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const id = uuidSchema.parse(req.params.id);
    const query = getHistoryQuerySchema.parse(req.query);

    const history = await service.getHistory(id, query);

    res.status(200).json({
      success: true,
      data: history.items,
      pagination: {
        total: history.total,
        limit: history.limit,
        offset: history.offset,
        hasMore: history.offset + history.items.length < history.total,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Get configuration history failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve configuration history',
    });
  }
}

/**
 * Validate a configuration
 * POST /api/remote-config/:id/validate
 */
export async function validate(req: Request, res: Response): Promise<void> {
  try {
    const id = uuidSchema.parse(req.params.id);
    const result = await service.validate(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Validate configuration failed');

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Configuration not found',
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate configuration',
    });
  }
}

/**
 * Migrate environment variables to database
 * POST /api/remote-config/migrate
 */
export async function migrate(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = migrateRequestSchema.parse(req.body) as any;
    const result = await service.migrate(validatedData);

    const statusCode = result.success ? 200 : 207; // 207 Multi-Status if partial failure

    res.status(statusCode).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to migrate configurations',
    });
  }
}
