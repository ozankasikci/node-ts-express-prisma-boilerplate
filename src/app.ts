import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { config } from './config/index.js';
import { redis } from './lib/redis.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { getMetrics, getMetricsContentType } from './lib/metrics.js';

/**
 * Express application setup
 * Configures all middleware and routes
 */
export const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  // TODO: Fix RedisStore compatibility with ioredis v5
  // Using in-memory store for now
  // store: new RedisStore({
  //   // @ts-expect-error - Redis client type mismatch
  //   client: redis,
  //   prefix: 'rl:',
  // }),
  message: {
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

app.use(limiter);

// Request ID middleware (must be before logger)
app.use(requestIdMiddleware);

// Request logging middleware
app.use(requestLogger);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics endpoint (before other routes)
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', getMetricsContentType());
  const metrics = await getMetrics();
  res.send(metrics);
});

// Routes
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import remoteConfigRoutes from './modules/remote-config/remote-config.routes.js';

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/remote-config', remoteConfigRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);
