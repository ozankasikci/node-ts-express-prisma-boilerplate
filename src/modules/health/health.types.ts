/**
 * TypeScript interfaces for health check module
 */

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
  };
  timestamp: string;
}

export interface LivenessStatus {
  status: 'alive';
  timestamp: string;
}
