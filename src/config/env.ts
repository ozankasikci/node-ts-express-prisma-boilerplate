import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Zod schema for environment variable validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGINS: z.string().transform((str) => str.split(',')),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // OpenTelemetry (optional)
  OTEL_SERVICE_NAME: z.string().optional().default('node-ts-template'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

  // Worker Settings
  WORKER_CONCURRENCY: z.string().regex(/^\d+$/).transform(Number).default('5'),
  WORKER_MAX_RETRIES: z.string().regex(/^\d+$/).transform(Number).default('3'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Export type for TypeScript
export type Env = z.infer<typeof envSchema>;
