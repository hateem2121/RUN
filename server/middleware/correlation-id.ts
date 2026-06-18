import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { correlationContext } from "../lib/monitoring/logger.js";

interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

/**
 * Middleware to generate or forward correlation ID for tracking requests
 */
export function correlationIdMiddleware(
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction,
) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    crypto.randomUUID();

  // Set on response headers for tracking/debugging
  res.setHeader("X-Correlation-ID", correlationId);

  // Set on req object for ease of access
  req.correlationId = correlationId;

  // Run downstream handlers inside AsyncLocalStorage context
  correlationContext.run(correlationId, () => {
    next();
  });
}
