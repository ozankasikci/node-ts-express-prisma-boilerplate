import { tasksRepository } from './tasks.repository.js';
import { taskQueue } from '../../lib/queue.js';
import { logger } from '../../lib/logger.js';
import type { TaskSubmitInput, TaskResponse, TaskResultResponse } from './tasks.types.js';

/**
 * Tasks service
 * Implements business logic for background task processing
 */

export const tasksService = {
  /**
   * Submit a new task to the queue
   */
  async submitTask(userId: string, input: TaskSubmitInput): Promise<TaskResponse> {
    // Create task in database
    const task = await tasksRepository.createTask({
      type: input.type,
      userId,
      parameters: input.parameters,
      priority: input.priority,
    });

    // Add task to BullMQ queue
    await taskQueue.add(
      input.type,
      {
        taskId: task.id,
        userId,
        parameters: input.parameters,
      },
      {
        priority: input.priority,
        jobId: task.id,
      }
    );

    logger.info({ taskId: task.id, type: input.type, userId }, 'Task submitted to queue');

    return {
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      submittedAt: task.submittedAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    };
  },

  /**
   * Get task by ID
   */
  async getTask(taskId: string, userId: string): Promise<TaskResponse & { result?: TaskResultResponse }> {
    const task = await tasksRepository.findById(taskId);

    if (!task) {
      throw Object.assign(new Error('Task not found'), {
        statusCode: 404,
        code: 'TASK_NOT_FOUND',
      });
    }

    // Ensure user owns the task
    if (task.userId !== userId) {
      throw Object.assign(new Error('Access denied'), {
        statusCode: 403,
        code: 'ACCESS_DENIED',
      });
    }

    return {
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      submittedAt: task.submittedAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      result: task.result
        ? {
            id: task.result.id,
            taskId: task.result.taskId,
            outputPath: task.result.outputPath,
            metadata: task.result.metadata as Record<string, unknown>,
            storageSize: task.result.storageSize,
            createdAt: task.result.createdAt,
            expiresAt: task.result.expiresAt,
          }
        : undefined,
    };
  },

  /**
   * List tasks for user
   */
  async listTasks(userId: string): Promise<TaskResponse[]> {
    const tasks = await tasksRepository.findByUserId(userId);

    return tasks.map((task) => ({
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      submittedAt: task.submittedAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    }));
  },
};
