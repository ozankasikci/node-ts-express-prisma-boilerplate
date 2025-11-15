import { prisma } from '../../lib/db.js';
import { TaskStatus } from '@prisma/client';

/**
 * Tasks repository
 * Handles database operations for background tasks
 */

export const tasksRepository = {
  /**
   * Create a new task
   */
  async createTask(data: {
    type: string;
    userId: string;
    parameters: Record<string, unknown>;
    priority?: number;
  }) {
    return prisma.task.create({
      data: {
        type: data.type,
        userId: data.userId,
        parameters: data.parameters,
        priority: data.priority ?? 0,
        status: TaskStatus.QUEUED,
      },
    });
  },

  /**
   * Find task by ID
   */
  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        result: true,
      },
    });
  },

  /**
   * Find tasks by user ID
   */
  async findByUserId(userId: string, limit = 50) {
    return prisma.task.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      include: {
        result: true,
      },
    });
  },

  /**
   * Update task status
   */
  async updateStatus(
    id: string,
    status: TaskStatus,
    data?: {
      startedAt?: Date;
      completedAt?: Date;
      errorMessage?: string;
      progress?: number;
    }
  ) {
    return prisma.task.update({
      where: { id },
      data: {
        status,
        ...data,
      },
    });
  },

  /**
   * Create task result
   */
  async createResult(data: {
    taskId: string;
    outputPath: string;
    metadata: Record<string, unknown>;
    storageSize: bigint;
    expiresAt: Date;
  }) {
    return prisma.taskResult.create({
      data,
    });
  },
};
