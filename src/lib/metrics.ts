import client from 'prom-client';
import { config } from '../config/index.js';

/**
 * Prometheus metrics initialization
 * Collects default metrics and custom application metrics
 */

// Collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  prefix: 'node_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
});

export const queueJobsTotal = new client.Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'],
});

/**
 * Remote Configuration Metrics
 */
export const configOperationsTotal = new client.Counter({
  name: 'config_operations_total',
  help: 'Total number of configuration operations',
  labelNames: ['operation', 'status'],
});

export const configEncryptionOperationsTotal = new client.Counter({
  name: 'config_encryption_operations_total',
  help: 'Total number of encryption/decryption operations',
  labelNames: ['operation', 'status'],
});

export const configValidationTotal = new client.Counter({
  name: 'config_validation_total',
  help: 'Total number of configuration validations',
  labelNames: ['status'],
});

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return client.register.metrics();
}

/**
 * Get content type for metrics
 */
export function getMetricsContentType(): string {
  return client.register.contentType;
}
