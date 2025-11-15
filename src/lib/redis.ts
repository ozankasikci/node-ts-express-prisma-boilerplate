import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

/**
 * Redis client for caching and queue backing store
 */
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    logger.error({ error: err }, 'Redis connection error');
    return true;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('error', (error) => {
  logger.error({ error }, 'Redis error');
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting');
});

/**
 * Disconnect from Redis
 * Graceful shutdown
 */
export async function disconnectRedis() {
  try {
    await redis.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect from Redis');
    throw error;
  }
}
