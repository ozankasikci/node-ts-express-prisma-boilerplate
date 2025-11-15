import { Router } from 'express';
import { authController } from './auth.controller.js';

/**
 * Authentication routes
 */
export const authRoutes = Router();

// POST /auth/register - Register new user
authRoutes.post('/register', (req, res, next) => {
  authController.register(req, res).catch(next);
});

// POST /auth/login - Login user
authRoutes.post('/login', (req, res, next) => {
  authController.login(req, res).catch(next);
});

// POST /auth/password-reset/request - Request password reset
authRoutes.post('/password-reset/request', (req, res, next) => {
  authController.requestPasswordReset(req, res).catch(next);
});

// POST /auth/password-reset/confirm - Confirm password reset
authRoutes.post('/password-reset/confirm', (req, res, next) => {
  authController.confirmPasswordReset(req, res).catch(next);
});
