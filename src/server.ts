import { createServer } from 'http';
import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { connectDb, disconnectDb } from './lib/db.js';
import { disconnectRedis } from './lib/redis.js';
import { initializeOtel, shutdownOtel } from './lib/otel.js';
import { activeConnections } from './lib/metrics.js';

/**
 * HTTP server entry point
 * Handles server lifecycle and graceful shutdown
 */

// Initialize OpenTelemetry
initializeOtel();

// Create HTTP server
const server = createServer(app);

// Track active connections
server.on('connection', (connection) => {
  activeConnections.inc();
  connection.on('close', () => {
    activeConnections.dec();
  });
});

/**
 * Start server
 */
async function start() {
  try {
    // Connect to database
    await connectDb();

    // Start server
    server.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.env,
        },
        `Server running on port ${config.port}`
      );
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down server');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Disconnect from database
      await disconnectDb();

      // Disconnect from Redis
      await disconnectRedis();

      // Shutdown OpenTelemetry
      await shutdownOtel();

      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start the server
start();
