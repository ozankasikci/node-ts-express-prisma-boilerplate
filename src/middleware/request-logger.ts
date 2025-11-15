import pinoHttp from 'pino-http';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { httpRequestDuration, httpRequestTotal } from '../lib/metrics.js';

/**
 * HTTP request logging middleware using pino-http
 * Logs all HTTP requests with correlation IDs and timing
 */
export const requestLogger = pinoHttp({
  logger,
  autoLogging: config.env !== 'test',
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  customProps: (req) => ({
    requestId: req.requestId,
  }),
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
      },
      remoteAddress: req.socket.remoteAddress,
      requestId: req.requestId,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  customReceivedMessage: (req) => {
    return `Incoming request: ${req.method} ${req.url}`;
  },
  // Record metrics
  wrapSerializers: false,
  customReceivedObject: (req, res) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const route = req.route?.path || req.path;

      httpRequestDuration.observe(
        {
          method: req.method,
          route,
          status_code: res.statusCode,
        },
        duration
      );

      httpRequestTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode,
      });
    });
    return {};
  },
});
