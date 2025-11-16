/**
 * Integration tests for Remote Config API
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Remote Config API', () => {
  let testConfigId: string;

  describe('POST /api/remote-config', () => {
    it('should create a new configuration', async () => {
      const response = await request(app).post('/api/remote-config').send({
        category: 'database',
        key: 'pool_size',
        value: 20,
        description: 'Database connection pool size',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.category).toBe('database');
      expect(response.body.data.key).toBe('pool_size');
      expect(response.body.data.value).toBe(20);

      testConfigId = response.body.data.id;
    });

    it('should create configuration with complex object value', async () => {
      const response = await request(app)
        .post('/api/remote-config')
        .send({
          category: 'email',
          key: 'smtp_settings',
          value: {
            host: 'smtp.example.com',
            port: 587,
            secure: true,
            auth: {
              user: 'test@example.com',
            },
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.value).toEqual({
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        auth: {
          user: 'test@example.com',
        },
      });
    });

    it('should auto-detect and encrypt sensitive keys', async () => {
      const response = await request(app)
        .post('/api/remote-config')
        .send({
          category: 'payment',
          key: 'api_key',
          value: 'sk_live_1234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isSensitive).toBe(true);
      expect(response.body.data.value).not.toBe('sk_live_1234567890');
      expect(response.body.data.value).toContain('***');
    });

    it('should explicitly encrypt when isSensitive is true', async () => {
      const response = await request(app)
        .post('/api/remote-config')
        .send({
          category: 'auth',
          key: 'jwt_secret',
          value: 'my-super-secret-jwt-key',
          isSensitive: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isSensitive).toBe(true);
      expect(response.body.data.value).toContain('***');
    });

    it('should reject duplicate category+key', async () => {
      await request(app).post('/api/remote-config').send({
        category: 'unique',
        key: 'test',
        value: 'first',
      });

      const response = await request(app).post('/api/remote-config').send({
        category: 'unique',
        key: 'test',
        value: 'second',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should validate category format', async () => {
      const response = await request(app).post('/api/remote-config').send({
        category: 'Invalid-Category', // Should be lowercase
        key: 'test',
        value: 'value',
      });

      expect(response.status).toBe(400);
    });

    it('should validate key format', async () => {
      const response = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'Invalid Key', // Should not have spaces
        value: 'value',
      });

      expect(response.status).toBe(400);
    });

    it('should create protected configuration', async () => {
      const response = await request(app)
        .post('/api/remote-config')
        .send({
          category: 'system',
          key: 'database_url',
          value: 'postgresql://localhost',
          isProtected: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isProtected).toBe(true);
    });
  });

  describe('GET /api/remote-config', () => {
    beforeAll(async () => {
      // Create test data
      await request(app).post('/api/remote-config').send({
        category: 'cache',
        key: 'ttl',
        value: 300,
        enabled: true,
      });

      await request(app).post('/api/remote-config').send({
        category: 'cache',
        key: 'max_size',
        value: 1000,
        enabled: true,
      });

      await request(app).post('/api/remote-config').send({
        category: 'feature_flags',
        key: 'new_ui',
        value: false,
        enabled: false,
      });
    });

    it('should list all enabled configurations', async () => {
      const response = await request(app).get('/api/remote-config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app).get('/api/remote-config?category=cache');

      expect(response.status).toBe(200);
      expect(response.body.data.every((c: any) => c.category === 'cache')).toBe(true);
    });

    it('should filter by enabled status', async () => {
      const response = await request(app).get('/api/remote-config?enabled=false');

      expect(response.status).toBe(200);
      expect(response.body.data.every((c: any) => c.enabled === false)).toBe(true);
    });

    it('should include disabled when requested', async () => {
      const response = await request(app).get('/api/remote-config?includeDisabled=true');

      expect(response.status).toBe(200);
      const disabledCount = response.body.data.filter((c: any) => !c.enabled).length;
      expect(disabledCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/remote-config/:id', () => {
    it('should retrieve configuration by ID', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'get_by_id',
        value: 'test_value',
      });

      const id = createResponse.body.data.id;

      const response = await request(app).get(`/api/remote-config/${id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(id);
      expect(response.body.data.value).toBe('test_value');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).get('/api/remote-config/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/remote-config/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/remote-config/category/:category/key/:key', () => {
    beforeAll(async () => {
      await request(app).post('/api/remote-config').send({
        category: 'storage',
        key: 'bucket_name',
        value: 'my-bucket',
      });
    });

    it('should retrieve configuration by category and key', async () => {
      const response = await request(app).get('/api/remote-config/category/storage/key/bucket_name');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('storage');
      expect(response.body.data.key).toBe('bucket_name');
      expect(response.body.data.value).toBe('my-bucket');
    });

    it('should return 404 for non-existent category/key', async () => {
      const response = await request(app).get('/api/remote-config/category/nonexistent/key/key');

      expect(response.status).toBe(404);
    });

    it('should fall back to environment variable', async () => {
      process.env.TEST_FALLBACK_VAR = 'from_environment';

      const response = await request(app).get('/api/remote-config/category/test/key/fallback_var');

      expect(response.status).toBe(200);
      expect(response.body.data.value).toBe('from_environment');

      delete process.env.TEST_FALLBACK_VAR;
    });
  });

  describe('PUT /api/remote-config/:id', () => {
    it('should update configuration value', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'update_test',
        value: 'initial',
      });

      const id = createResponse.body.data.id;

      const response = await request(app).put(`/api/remote-config/${id}`).send({
        value: 'updated',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.value).toBe('updated');
    });

    it('should update description', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'desc_update',
        value: 'value',
      });

      const id = createResponse.body.data.id;

      const response = await request(app).put(`/api/remote-config/${id}`).send({
        description: 'Updated description',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should update enabled status', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'enabled_update',
        value: 'value',
        enabled: true,
      });

      const id = createResponse.body.data.id;

      const response = await request(app).put(`/api/remote-config/${id}`).send({
        enabled: false,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.enabled).toBe(false);
    });

    it('should accept reason for update', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'reason_test',
        value: 'v1',
      });

      const id = createResponse.body.data.id;

      const response = await request(app).put(`/api/remote-config/${id}`).send({
        value: 'v2',
        reason: 'Updated for performance',
      });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).put('/api/remote-config/00000000-0000-0000-0000-000000000000').send({
        value: 'updated',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/remote-config/:id', () => {
    it('should delete a non-protected configuration', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'delete_test',
        value: 'value',
      });

      const id = createResponse.body.data.id;

      const response = await request(app).delete(`/api/remote-config/${id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const getResponse = await request(app).get(`/api/remote-config/${id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should reject deletion of protected configuration', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'protected_delete',
        value: 'value',
        isProtected: true,
      });

      const id = createResponse.body.data.id;

      const response = await request(app).delete(`/api/remote-config/${id}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('protected');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).delete('/api/remote-config/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/remote-config/:id/history', () => {
    it('should retrieve configuration history', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'history_test',
        value: 'v1',
      });

      const id = createResponse.body.data.id;

      // Create some history
      await request(app).put(`/api/remote-config/${id}`).send({ value: 'v2' });
      await request(app).put(`/api/remote-config/${id}`).send({ value: 'v3' });

      const response = await request(app).get(`/api/remote-config/${id}/history`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'pagination_test',
        value: 'v1',
      });

      const id = createResponse.body.data.id;

      // Create multiple history entries
      for (let i = 2; i <= 5; i++) {
        await request(app).put(`/api/remote-config/${id}`).send({ value: `v${i}` });
      }

      const response = await request(app).get(`/api/remote-config/${id}/history?limit=2&offset=0`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(0);
    });
  });

  describe('POST /api/remote-config/:id/validate', () => {
    it('should validate a configuration', async () => {
      const createResponse = await request(app).post('/api/remote-config').send({
        category: 'test',
        key: 'validate_test',
        value: 'valid_value',
      });

      const id = createResponse.body.data.id;

      const response = await request(app).post(`/api/remote-config/${id}/validate`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.status).toBe('valid');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).post('/api/remote-config/00000000-0000-0000-0000-000000000000/validate');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/remote-config/migrate', () => {
    it('should migrate environment variables to database', async () => {
      process.env.MIGRATE_TEST_HOST = 'localhost';
      process.env.MIGRATE_TEST_PORT = '5432';

      const response = await request(app)
        .post('/api/remote-config/migrate')
        .send({
          dryRun: false,
          mappings: [
            {
              envVar: 'MIGRATE_TEST_HOST',
              category: 'migrated',
              key: 'host',
            },
            {
              envVar: 'MIGRATE_TEST_PORT',
              category: 'migrated',
              key: 'port',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.migratedCount).toBe(2);
      expect(response.body.data.skippedCount).toBe(0);

      delete process.env.MIGRATE_TEST_HOST;
      delete process.env.MIGRATE_TEST_PORT;
    });

    it('should support dry run mode', async () => {
      process.env.DRY_RUN_TEST = 'test_value';

      const response = await request(app)
        .post('/api/remote-config/migrate')
        .send({
          dryRun: true,
          mappings: [
            {
              envVar: 'DRY_RUN_TEST',
              category: 'test',
              key: 'dry_run',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.migratedCount).toBe(1);
      expect(response.body.data.details[0].reason).toContain('Dry run');

      // Should not actually create the config
      const getResponse = await request(app).get('/api/remote-config/category/test/key/dry_run');
      expect(getResponse.body.data.id).toBe('env-var'); // Falls back to env var

      delete process.env.DRY_RUN_TEST;
    });

    it('should skip unset environment variables', async () => {
      const response = await request(app)
        .post('/api/remote-config/migrate')
        .send({
          dryRun: false,
          mappings: [
            {
              envVar: 'NONEXISTENT_VAR',
              category: 'test',
              key: 'nonexistent',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.skippedCount).toBe(1);
      expect(response.body.data.details[0].reason).toContain('not set');
    });

    it('should skip existing configurations', async () => {
      await request(app).post('/api/remote-config').send({
        category: 'existing',
        key: 'key',
        value: 'database_value',
      });

      process.env.EXISTING_KEY = 'env_value';

      const response = await request(app)
        .post('/api/remote-config/migrate')
        .send({
          dryRun: false,
          mappings: [
            {
              envVar: 'EXISTING_KEY',
              category: 'existing',
              key: 'key',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.skippedCount).toBe(1);
      expect(response.body.data.details[0].reason).toContain('already exists');

      delete process.env.EXISTING_KEY;
    });

    it('should migrate with sensitive flag', async () => {
      process.env.SENSITIVE_MIGRATE = 'secret123';

      const response = await request(app)
        .post('/api/remote-config/migrate')
        .send({
          dryRun: false,
          mappings: [
            {
              envVar: 'SENSITIVE_MIGRATE',
              category: 'secure',
              key: 'migrated_secret',
              isSensitive: true,
            },
          ],
        });

      expect(response.status).toBe(200);

      const config = await request(app).get('/api/remote-config/category/secure/key/migrated_secret');
      expect(config.body.data.isSensitive).toBe(true);

      delete process.env.SENSITIVE_MIGRATE;
    });
  });

  describe('Encryption end-to-end', () => {
    it('should encrypt sensitive value in database but mask in response', async () => {
      const createResponse = await request(app)
        .post('/api/remote-config')
        .send({
          category: 'secure',
          key: 'api_key',
          value: 'sk_live_verysecretkey123',
          isSensitive: true,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.isSensitive).toBe(true);
      expect(createResponse.body.data.value).not.toBe('sk_live_verysecretkey123');
      expect(createResponse.body.data.value).toContain('***');

      const id = createResponse.body.data.id;

      // Retrieve by ID - should still be masked
      const getResponse = await request(app).get(`/api/remote-config/${id}`);
      expect(getResponse.body.data.value).toContain('***');

      // Retrieve by category+key - should still be masked
      const getCategoryResponse = await request(app).get('/api/remote-config/category/secure/key/api_key');
      expect(getCategoryResponse.body.data.value).toContain('***');
    });
  });

  describe('Category organization', () => {
    it('should enforce category naming rules', async () => {
      const invalidCategories = ['UPPERCASE', 'with-dashes', 'with spaces', '123start'];

      for (const category of invalidCategories) {
        const response = await request(app).post('/api/remote-config').send({
          category,
          key: 'test',
          value: 'value',
        });

        expect(response.status).toBe(400);
      }
    });

    it('should accept valid category names', async () => {
      const validCategories = ['database', 'cache_settings', 'api_v2', 'feature_flags_beta'];

      for (const category of validCategories) {
        const response = await request(app).post('/api/remote-config').send({
          category,
          key: `${category}_test`,
          value: 'value',
        });

        expect(response.status).toBe(201);
      }
    });
  });
});
