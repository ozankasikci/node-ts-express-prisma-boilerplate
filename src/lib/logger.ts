import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Pino structured JSON logger
 * Provides consistent logging across the application
 */
export const logger = pino({
  level: config.logger.level,
  transport: config.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: config.env,
  },
});

/**
 * Create a child logger with additional context
 */
export const createLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};
