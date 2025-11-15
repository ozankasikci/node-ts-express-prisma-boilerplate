import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID middleware
 * Generates a unique ID for each request for correlation tracking
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Attach to request object
  req.requestId = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
}
