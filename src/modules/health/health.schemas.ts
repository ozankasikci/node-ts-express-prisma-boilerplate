import { z } from 'zod';

/**
 * Zod schemas for health check responses
 */

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string().datetime(),
  uptime: z.number().positive(),
});

export const readinessResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  services: z.object({
    database: z.enum(['connected', 'disconnected', 'error']),
    redis: z.enum(['connected', 'disconnected', 'error']),
  }),
  timestamp: z.string().datetime(),
});

export const livenessResponseSchema = z.object({
  status: z.enum(['alive']),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
export type LivenessResponse = z.infer<typeof livenessResponseSchema>;
