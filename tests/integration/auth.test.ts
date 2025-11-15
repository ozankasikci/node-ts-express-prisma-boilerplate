import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { seedUser, clearDatabase } from '../helpers/database';
import { createUserData, createRegistrationData, createLoginCredentials } from '../fixtures/users';
import { createExpiredToken, createAccessToken } from '../fixtures/auth';

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /auth/register', () => {
    it('should create user and return token when valid data provided', async () => {
      const userData = createRegistrationData();

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
    });

    it('should validate email format', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'invalid-email',
        password: 'TestPassword123',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate password strength', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate name length', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'TestPassword123',
        name: 'T',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app).post('/auth/register').send({
        password: 'TestPassword123',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 when email already exists', async () => {
      const userData = createRegistrationData();

      // Register user first time
      await request(app).post('/auth/register').send(userData);

      // Try to register again with same email
      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should return 400 when malformed JSON is sent', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully and return token', async () => {
      const password = 'TestPassword123';
      const user = await seedUser({
        email: 'test@example.com',
        password,
        name: 'Test User',
      });

      const response = await request(app).post('/auth/login').send({
        email: user.email,
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(user.email);
    });

    it('should validate email format', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'invalid-email',
        password: 'TestPassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 when user does not exist', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'TestPassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 when password is incorrect', async () => {
      await seedUser({
        email: 'test@example.com',
        password: 'CorrectPassword123',
        name: 'Test User',
      });

      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'WrongPassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 when malformed JSON is sent', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/password-reset/request', () => {
    it('should validate email format', async () => {
      const response = await request(app).post('/auth/password-reset/request').send({
        email: 'invalid-email',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid email without revealing if user exists', async () => {
      const response = await request(app).post('/auth/password-reset/request').send({
        email: 'nonexistent@example.com',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If the email exists');
    });
  });

  describe('POST /auth/password-reset/confirm', () => {
    it('should validate token requirement', async () => {
      const response = await request(app).post('/auth/password-reset/confirm').send({
        token: '',
        newPassword: 'NewPassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate new password strength', async () => {
      const response = await request(app).post('/auth/password-reset/confirm').send({
        token: 'some-token',
        newPassword: 'weak',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
