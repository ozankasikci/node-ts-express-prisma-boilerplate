import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { config } from '../config/index.js';
import { logger } from './logger.js';

/**
 * OpenTelemetry SDK configuration
 * Provides distributed tracing for the application
 */

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initializeOtel() {
  // Only initialize if OTLP endpoint is configured
  if (!config.otel.endpoint) {
    logger.info('OpenTelemetry not configured (OTEL_EXPORTER_OTLP_ENDPOINT not set)');
    return;
  }

  try {
    sdk = new NodeSDK({
      resource: new Resource({
        'service.name': config.otel.serviceName,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable file system instrumentation in development
          '@opentelemetry/instrumentation-fs': {
            enabled: config.isProduction,
          },
        }),
      ],
    });

    sdk.start();
    logger.info('OpenTelemetry initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize OpenTelemetry');
  }
}

/**
 * Shutdown OpenTelemetry SDK
 */
export async function shutdownOtel() {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info('OpenTelemetry shut down');
    } catch (error) {
      logger.error({ error }, 'Failed to shutdown OpenTelemetry');
    }
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  await shutdownOtel();
});
