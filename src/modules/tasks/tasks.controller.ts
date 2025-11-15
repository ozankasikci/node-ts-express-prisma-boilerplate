import { Request, Response } from 'express';
import { tasksService } from './tasks.service.js';
import { taskSubmitSchema } from './tasks.schemas.js';

/**
 * Tasks controller
 * Handles HTTP requests for task endpoints
 */

export const tasksController = {
  /**
   * POST /api/v1/tasks
   */
  async submitTask(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const input = taskSubmitSchema.parse(req.body);
    const task = await tasksService.submitTask(req.user.id, input);
    res.status(201).json(task);
  },

  /**
   * GET /api/v1/tasks/:id
   */
  async getTask(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const task = await tasksService.getTask(req.params.id, req.user.id);
    res.json(task);
  },

  /**
   * GET /api/v1/tasks
   */
  async listTasks(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const tasks = await tasksService.listTasks(req.user.id);
    res.json(tasks);
  },
};
