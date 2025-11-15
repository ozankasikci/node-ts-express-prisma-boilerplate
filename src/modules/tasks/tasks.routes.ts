import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

/**
 * Tasks routes
 * All routes require authentication
 */
export const tasksRoutes = Router();

// Apply auth middleware to all task routes
tasksRoutes.use(authMiddleware);

// POST /api/v1/tasks - Submit new task
tasksRoutes.post('/', (req, res, next) => {
  tasksController.submitTask(req, res).catch(next);
});

// GET /api/v1/tasks - List user's tasks
tasksRoutes.get('/', (req, res, next) => {
  tasksController.listTasks(req, res).catch(next);
});

// GET /api/v1/tasks/:id - Get task by ID
tasksRoutes.get('/:id', (req, res, next) => {
  tasksController.getTask(req, res).catch(next);
});
