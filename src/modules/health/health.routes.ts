import { Router } from 'express';
import { getHealth, getReadiness, getLiveness } from './health.controller.js';

/**
 * Health check routes
 */
export const healthRoutes = Router();

// GET /health - Basic health check
healthRoutes.get('/', getHealth);

// GET /health/ready - Readiness check
healthRoutes.get('/ready', getReadiness);

// GET /health/live - Liveness check
healthRoutes.get('/live', getLiveness);
