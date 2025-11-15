import { z } from 'zod';

/**
 * Zod schemas for tasks module
 */

export const taskSubmitSchema = z.object({
  type: z.string().min(1, 'Task type is required'),
  parameters: z.record(z.unknown()).default({}),
  priority: z.number().int().default(0),
});

export type TaskSubmitInput = z.infer<typeof taskSubmitSchema>;
