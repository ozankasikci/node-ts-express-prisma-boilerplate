/**
 * Remote Configuration Routes
 *
 * API endpoint definitions for configuration management
 */

import { Router } from 'express';
import * as controller from './remote-config.controller.js';

const router = Router();

/**
 * POST /api/remote-config
 * Create a new configuration
 */
router.post('/', controller.create);

/**
 * GET /api/remote-config
 * Get all configurations with optional filtering
 * Query params: category, enabled, includeDisabled
 */
router.get('/', controller.getAll);

/**
 * GET /api/remote-config/:id
 * Get configuration by ID
 */
router.get('/:id', controller.getById);

/**
 * GET /api/remote-config/category/:category/key/:key
 * Get configuration by category and key
 */
router.get('/category/:category/key/:key', controller.getByCategoryAndKey);

/**
 * PUT /api/remote-config/:id
 * Update an existing configuration
 */
router.put('/:id', controller.update);

/**
 * DELETE /api/remote-config/:id
 * Delete a configuration
 */
router.delete('/:id', controller.deleteConfig);

/**
 * GET /api/remote-config/:id/history
 * Get configuration change history
 * Query params: limit, offset
 */
router.get('/:id/history', controller.getHistory);

/**
 * POST /api/remote-config/:id/validate
 * Validate a configuration value
 */
router.post('/:id/validate', controller.validate);

/**
 * POST /api/remote-config/migrate
 * Migrate environment variables to database
 */
router.post('/migrate', controller.migrate);

export default router;
