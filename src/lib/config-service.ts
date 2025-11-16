import { logger } from './logger.js';
import type { ConfigValue } from '../modules/remote-config/remote-config.types.js';

/**
 * Cache entry for configuration values
 */
interface CacheEntry {
  value: ConfigValue;
  timestamp: number;
}

/**
 * ConfigService provides application-facing configuration access with caching
 *
 * This is a lightweight facade that will delegate to RemoteConfigService
 * once the remote-config module is fully implemented.
 *
 * For now, it provides environment variable fallback functionality.
 */
class ConfigService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 1000;
  private remoteConfigService: any = null; // Will be set during initialization

  /**
   * Get a configuration value by category and key
   *
   * Lookup order:
   * 1. Check in-memory cache
   * 2. Query database via RemoteConfigService (if available)
   * 3. Fall back to environment variable
   * 4. Return default value if provided
   *
   * @param category - Configuration category (e.g., "database", "cache")
   * @param key - Configuration key (e.g., "pool_size")
   * @param defaultValue - Optional default value if not found
   * @returns Configuration value or null
   */
  async get<T = ConfigValue>(
    category: string,
    key: string,
    defaultValue: T | null = null
  ): Promise<T | null> {
    const cacheKey = `${category}:${key}`;

    // Check cache first
    const cached = this.getCached<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      // Try to get from remote config service (database)
      if (this.remoteConfigService) {
        const config = await this.remoteConfigService.getByCategoryAndKey(category, key);
        if (config) {
          this.setCache(cacheKey, config.value);
          return config.value as T;
        }
      }

      // Fall back to environment variable
      const envValue = this.getFromEnvironment(category, key);
      if (envValue !== null) {
        this.setCache(cacheKey, envValue);
        return envValue as T;
      }

      // Return default value if provided
      if (defaultValue !== null) {
        return defaultValue;
      }

      logger.debug({ category, key }, 'Configuration not found in database or environment');
      return null;
    } catch (error) {
      logger.error({ error, category, key }, 'Failed to retrieve configuration');
      return defaultValue;
    }
  }

  /**
   * Get value from environment variable using multiple naming patterns
   *
   * Naming patterns tried (in order):
   * 1. {CATEGORY}_{KEY} (e.g., DATABASE_POOL_SIZE)
   * 2. {KEY} (e.g., POOL_SIZE)
   *
   * @param category - Configuration category
   * @param key - Configuration key
   * @returns Environment variable value or null
   */
  private getFromEnvironment(category: string, key: string): ConfigValue | null {
    // Pattern 1: CATEGORY_KEY
    const pattern1 = `${category.toUpperCase()}_${key.toUpperCase()}`;
    if (process.env[pattern1]) {
      return this.parseEnvValue(process.env[pattern1]!);
    }

    // Pattern 2: KEY only
    const pattern2 = key.toUpperCase();
    if (process.env[pattern2]) {
      return this.parseEnvValue(process.env[pattern2]!);
    }

    return null;
  }

  /**
   * Parse environment variable value to appropriate type
   *
   * Attempts to parse as JSON first, falls back to string
   */
  private parseEnvValue(value: string): ConfigValue {
    // Try to parse as JSON (for numbers, booleans, objects, arrays)
    try {
      return JSON.parse(value);
    } catch {
      // If not valid JSON, return as string
      return value;
    }
  }

  /**
   * Get value from cache if not expired
   */
  private getCached<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache with LRU eviction
   */
  private setCache(cacheKey: string, value: ConfigValue): void {
    // Simple LRU: if cache is full, delete oldest entry
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear specific cache entry
   */
  clearCache(category: string, key: string): void {
    const cacheKey = `${category}:${key}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cached configuration values
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Set the remote config service instance
   * Called during application initialization
   */
  setRemoteConfigService(service: any): void {
    this.remoteConfigService = service;
    logger.info('Remote config service registered with ConfigService');
  }
}

/**
 * Singleton instance for application-wide config access
 */
export const configService = new ConfigService();
