import { Request, Response } from 'express';
import { prisma } from '../../lib/db.js';
import { redis } from '../../lib/redis.js';
import type { HealthStatus, ReadinessStatus, LivenessStatus } from './health.types.js';

/**
 * Health check controller
 * Implements basic, readiness, and liveness checks
 */

/**
 * Basic health check
 * Returns server status and uptime
 */
export async function getHealth(req: Request, res: Response) {
  const response: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  res.json(response);
}

/**
 * Readiness check
 * Checks if service dependencies are ready (database, redis)
 */
export async function getReadiness(req: Request, res: Response) {
  let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = 'connected';
  } catch (error) {
    databaseStatus = 'error';
  }

  // Check Redis connection
  try {
    const pong = await redis.ping();
    redisStatus = pong === 'PONG' ? 'connected' : 'error';
  } catch (error) {
    redisStatus = 'error';
  }

  const isReady = databaseStatus === 'connected' && redisStatus === 'connected';

  const response: ReadinessStatus = {
    status: isReady ? 'ready' : 'not_ready',
    services: {
      database: databaseStatus,
      redis: redisStatus,
    },
    timestamp: new Date().toISOString(),
  };

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json(response);
}

/**
 * Liveness check
 * Simple check to verify the service is alive
 */
export async function getLiveness(req: Request, res: Response) {
  const response: LivenessStatus = {
    status: 'alive',
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}
