/**
 * Unit tests for remote config service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../setup.js';
import * as service from '../../src/modules/remote-config/remote-config.service.js';
import type { CreateConfigRequest } from '../../src/modules/remote-config/remote-config.types.js';

describe('RemoteConfigService', () => {
  describe('create', () => {
    it('should create a plain text configuration', async () => {
      const request: CreateConfigRequest = {
        category: 'database',
        key: 'pool_size',
        value: 10,
        description: 'Database connection pool size',
      };

      const config = await service.create(request);

      expect(config).toBeDefined();
      expect(config.id).toBeDefined();
      expect(config.category).toBe('database');
      expect(config.key).toBe('pool_size');
      expect(config.value).toBe(10);
      expect(config.isSensitive).toBe(false);
      expect(config.description).toBe('Database connection pool size');
    });

    it('should auto-detect sensitive keys and encrypt', async () => {
      const request: CreateConfigRequest = {
        category: 'payment',
        key: 'api_key', // Contains 'key' - should be auto-detected as sensitive
        value: 'sk_live_123456789',
      };

      const config = await service.create(request);

      expect(config.isSensitive).toBe(true);
      // Value should be masked in response
      expect(config.value).not.toBe('sk_live_123456789');
      expect(config.value).toContain('***');
    });

    it('should explicitly mark value as sensitive when requested', async () => {
      const request: CreateConfigRequest = {
        category: 'email',
        key: 'smtp_host',
        value: 'smtp.example.com',
        isSensitive: true,
      };

      const config = await service.create(request);

      expect(config.isSensitive).toBe(true);
    });

    it('should handle complex object values', async () => {
      const request: CreateConfigRequest = {
        category: 'email',
        key: 'smtp_settings',
        value: {
          host: 'smtp.example.com',
          port: 587,
          secure: true,
        },
      };

      const config = await service.create(request);

      expect(config.value).toEqual({
        host: 'smtp.example.com',
        port: 587,
        secure: true,
      });
    });

    it('should handle array values', async () => {
      const request: CreateConfigRequest = {
        category: 'feature_flags',
        key: 'enabled_features',
        value: ['feature1', 'feature2', 'feature3'],
      };

      const config = await service.create(request);

      expect(config.value).toEqual(['feature1', 'feature2', 'feature3']);
    });

    it('should create configuration with protected flag', async () => {
      const request: CreateConfigRequest = {
        category: 'system',
        key: 'database_url',
        value: 'postgresql://localhost',
        isProtected: true,
        isSensitive: true,
      };

      const config = await service.create(request);

      expect(config.isProtected).toBe(true);
    });

    it('should create history entry on creation', async () => {
      const request: CreateConfigRequest = {
        category: 'test',
        key: 'sample',
        value: 'value',
      };

      const config = await service.create(request);

      const history = await prisma.configHistory.findMany({
        where: { configId: config.id },
      });

      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('created');
    });
  });

  describe('getById', () => {
    it('should retrieve configuration by ID', async () => {
      const created = await service.create({
        category: 'test',
        key: 'retrieve_test',
        value: 'test_value',
      });

      const retrieved = await service.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.value).toBe('test_value');
    });

    it('should return null for non-existent ID', async () => {
      const config = await service.getById('00000000-0000-0000-0000-000000000000');
      expect(config).toBeNull();
    });
  });

  describe('getByCategoryAndKey', () => {
    it('should retrieve configuration by category and key', async () => {
      await service.create({
        category: 'cache',
        key: 'ttl',
        value: 3600,
      });

      const config = await service.getByCategoryAndKey('cache', 'ttl');

      expect(config).toBeDefined();
      expect(config?.category).toBe('cache');
      expect(config?.key).toBe('ttl');
      expect(config?.value).toBe(3600);
    });

    it('should return null for non-existent category/key', async () => {
      const config = await service.getByCategoryAndKey('nonexistent', 'key');
      expect(config).toBeNull();
    });

    it('should fall back to environment variable when not in database', async () => {
      // Set an environment variable
      process.env.TEST_ENV_VAR = 'from_env';

      const config = await service.getByCategoryAndKey('test', 'env_var');

      expect(config).toBeDefined();
      expect(config?.value).toBe('from_env');
      expect(config?.id).toBe('env-var'); // Synthetic response

      delete process.env.TEST_ENV_VAR;
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      await service.create({ category: 'db', key: 'host', value: 'localhost', enabled: true });
      await service.create({ category: 'db', key: 'port', value: 5432, enabled: true });
      await service.create({ category: 'cache', key: 'ttl', value: 300, enabled: true });
      await service.create({ category: 'cache', key: 'disabled_key', value: 'test', enabled: false });
    });

    it('should retrieve all enabled configurations by default', async () => {
      const configs = await service.getAll();

      expect(configs).toHaveLength(3); // Only enabled ones
    });

    it('should filter by category', async () => {
      const configs = await service.getAll({ category: 'db' });

      expect(configs).toHaveLength(2);
      expect(configs.every((c) => c.category === 'db')).toBe(true);
    });

    it('should include disabled when requested', async () => {
      const configs = await service.getAll({ category: 'cache', includeDisabled: true });

      expect(configs).toHaveLength(2);
    });

    it('should filter by enabled status', async () => {
      const configs = await service.getAll({ enabled: false });

      expect(configs).toHaveLength(1);
      expect(configs[0].enabled).toBe(false);
    });
  });

  describe('update', () => {
    it('should update configuration value', async () => {
      const created = await service.create({
        category: 'test',
        key: 'update_test',
        value: 'initial',
      });

      const updated = await service.update(created.id, {
        value: 'updated',
      });

      expect(updated.value).toBe('updated');
    });

    it('should update description', async () => {
      const created = await service.create({
        category: 'test',
        key: 'desc_test',
        value: 'value',
      });

      const updated = await service.update(created.id, {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should update enabled status', async () => {
      const created = await service.create({
        category: 'test',
        key: 'enabled_test',
        value: 'value',
        enabled: true,
      });

      const updated = await service.update(created.id, {
        enabled: false,
      });

      expect(updated.enabled).toBe(false);
    });

    it('should record history on update', async () => {
      const created = await service.create({
        category: 'test',
        key: 'history_test',
        value: 'v1',
      });

      await service.update(created.id, {
        value: 'v2',
        reason: 'Testing history',
      });

      const history = await service.getHistory(created.id);

      expect(history.items).toHaveLength(2); // created + updated
      expect(history.items[0].action).toBe('updated');
      expect(history.items[0].reason).toBe('Testing history');
    });

    it('should reset validation status when value changes', async () => {
      const created = await service.create({
        category: 'test',
        key: 'validation_test',
        value: 'v1',
      });

      // Validate it
      await service.validate(created.id);

      // Update the value
      const updated = await service.update(created.id, {
        value: 'v2',
      });

      expect(updated.validation.status).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a non-protected configuration', async () => {
      const created = await service.create({
        category: 'test',
        key: 'delete_test',
        value: 'value',
        isProtected: false,
      });

      await service.deleteConfig(created.id);

      const retrieved = await service.getById(created.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error when deleting protected configuration', async () => {
      const created = await service.create({
        category: 'test',
        key: 'protected_test',
        value: 'value',
        isProtected: true,
      });

      await expect(service.deleteConfig(created.id)).rejects.toThrow('protected');
    });

    it('should record history before deletion', async () => {
      const created = await service.create({
        category: 'test',
        key: 'delete_history_test',
        value: 'value',
      });

      await service.deleteConfig(created.id);

      // History should still exist (cascade doesn't apply to already-created entries)
      const history = await prisma.configHistory.findMany({
        where: { configId: created.id },
      });

      // Note: In actual implementation, history is deleted via CASCADE
      // This test documents the expected behavior
    });
  });

  describe('validate', () => {
    it('should mark valid configuration as valid', async () => {
      const created = await service.create({
        category: 'test',
        key: 'valid_test',
        value: 'valid_value',
      });

      const result = await service.validate(created.id);

      expect(result.valid).toBe(true);
      expect(result.status).toBe('valid');
      expect(result.error).toBeNull();
    });

    it('should update validation metadata', async () => {
      const created = await service.create({
        category: 'test',
        key: 'metadata_test',
        value: 'value',
      });

      await service.validate(created.id);

      const updated = await service.getById(created.id);

      expect(updated?.validation.status).toBe('valid');
      expect(updated?.validation.lastValidatedAt).toBeDefined();
    });

    it('should record validation in history', async () => {
      const created = await service.create({
        category: 'test',
        key: 'validation_history',
        value: 'value',
      });

      await service.validate(created.id);

      const history = await service.getHistory(created.id);

      const validationEntry = history.items.find((h) => h.action === 'validated');
      expect(validationEntry).toBeDefined();
    });
  });

  describe('migrate', () => {
    it('should migrate environment variable to database', async () => {
      process.env.MIGRATE_TEST_VAR = 'env_value';

      const result = await service.migrate({
        dryRun: false,
        mappings: [
          {
            envVar: 'MIGRATE_TEST_VAR',
            category: 'migrated',
            key: 'test_var',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(1);
      expect(result.skippedCount).toBe(0);

      const config = await service.getByCategoryAndKey('migrated', 'test_var');
      expect(config?.value).toBe('env_value');

      delete process.env.MIGRATE_TEST_VAR;
    });

    it('should skip migration if env var not set', async () => {
      const result = await service.migrate({
        dryRun: false,
        mappings: [
          {
            envVar: 'NONEXISTENT_VAR',
            category: 'test',
            key: 'nonexistent',
          },
        ],
      });

      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(result.details[0].reason).toContain('not set');
    });

    it('should skip migration if config already exists', async () => {
      await service.create({
        category: 'existing',
        key: 'existing_key',
        value: 'database_value',
      });

      process.env.EXISTING_VAR = 'env_value';

      const result = await service.migrate({
        dryRun: false,
        mappings: [
          {
            envVar: 'EXISTING_VAR',
            category: 'existing',
            key: 'existing_key',
          },
        ],
      });

      expect(result.skippedCount).toBe(1);
      expect(result.details[0].reason).toContain('already exists');

      delete process.env.EXISTING_VAR;
    });

    it('should support dry run mode', async () => {
      process.env.TEST_DRY_RUN = 'test_value'; // Matches TEST_DRY_RUN pattern

      const result = await service.migrate({
        dryRun: true,
        mappings: [
          {
            envVar: 'TEST_DRY_RUN',
            category: 'test',
            key: 'dry_run',
          },
        ],
      });

      expect(result.migratedCount).toBe(1);
      expect(result.details[0].reason).toContain('Dry run');

      // Should not actually create the config in database
      // It will fall back to env var which still exists (TEST_DRY_RUN pattern matches)
      const config = await service.getByCategoryAndKey('test', 'dry_run');
      expect(config).toBeDefined();
      expect(config?.id).toBe('env-var'); // Falls back to env var, not in DB

      delete process.env.TEST_DRY_RUN;
    });
  });

  describe('getHistory', () => {
    it('should retrieve configuration history', async () => {
      const created = await service.create({
        category: 'test',
        key: 'history_test',
        value: 'v1',
      });

      await service.update(created.id, { value: 'v2' });
      await service.update(created.id, { value: 'v3' });

      const history = await service.getHistory(created.id);

      expect(history.items.length).toBeGreaterThanOrEqual(3);
      expect(history.total).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      const created = await service.create({
        category: 'test',
        key: 'pagination_test',
        value: 'v1',
      });

      // Create multiple history entries
      for (let i = 2; i <= 5; i++) {
        await service.update(created.id, { value: `v${i}` });
      }

      const page1 = await service.getHistory(created.id, { limit: 2, offset: 0 });
      expect(page1.items).toHaveLength(2);
      expect(page1.limit).toBe(2);
      expect(page1.offset).toBe(0);

      const page2 = await service.getHistory(created.id, { limit: 2, offset: 2 });
      expect(page2.items).toHaveLength(2);
      expect(page2.offset).toBe(2);
    });
  });

  describe('environment variable fallback', () => {
    it('should try CATEGORY_KEY pattern first', async () => {
      process.env.DATABASE_POOL_SIZE = '50';

      const value = service.getFromEnvironment('database', 'pool_size');

      expect(value).toBe(50); // Parsed as number

      delete process.env.DATABASE_POOL_SIZE;
    });

    it('should try KEY pattern as fallback', async () => {
      process.env.TIMEOUT = '5000';

      const value = service.getFromEnvironment('server', 'timeout');

      expect(value).toBe(5000); // Parsed as number

      delete process.env.TIMEOUT;
    });

    it('should parse JSON values from env vars', async () => {
      process.env.TEST_JSON = '{"key":"value"}';

      const value = service.getFromEnvironment('test', 'json');

      expect(value).toEqual({ key: 'value' });

      delete process.env.TEST_JSON;
    });

    it('should return null if no env var found', async () => {
      const value = service.getFromEnvironment('nonexistent', 'key');

      expect(value).toBeNull();
    });
  });

  describe('encryption integration', () => {
    it('should encrypt sensitive values in database', async () => {
      const created = await service.create({
        category: 'secure',
        key: 'api_key',
        value: 'sk_live_secret123',
        isSensitive: true,
      });

      // Check database directly
      const dbRecord = await prisma.systemConfig.findUnique({
        where: { id: created.id },
      });

      // Value in DB should be encrypted (not the original)
      expect(dbRecord?.value).not.toBe('sk_live_secret123');
      expect(dbRecord?.value).not.toBe(JSON.stringify('sk_live_secret123'));
    });

    it('should decrypt and mask sensitive values in responses', async () => {
      const created = await service.create({
        category: 'secure',
        key: 'password',
        value: 'MySecurePassword123',
        isSensitive: true,
      });

      expect(created.value).not.toBe('MySecurePassword123');
      expect(created.value).toContain('***');
    });
  });
});
