import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from './auth.schemas.js';

/**
 * Authentication controller
 * Handles HTTP requests for authentication endpoints
 */

export const authController = {
  /**
   * POST /auth/register
   */
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  },

  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json(result);
  },

  /**
   * POST /auth/password-reset/request
   */
  async requestPasswordReset(req: Request, res: Response) {
    const input = passwordResetRequestSchema.parse(req.body);
    const result = await authService.requestPasswordReset(input);
    res.json(result);
  },

  /**
   * POST /auth/password-reset/confirm
   */
  async confirmPasswordReset(req: Request, res: Response) {
    const input = passwordResetConfirmSchema.parse(req.body);
    const result = await authService.confirmPasswordReset(input);
    res.json(result);
  },
};
