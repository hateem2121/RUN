/**
 * CORRELATION ID MIDDLEWARE
 * Phase 3 (Observability): Request tracing for distributed logging
 */

import { randomUUID } from "node:crypto";
import { trace } from "@opentelemetry/api";
import type { NextFunction, Request, Response } from "express";
import { correlationContext } from "../lib/monitoring/logger.js";

export interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

/**
 * Generate unique correlation ID for each request
 * Enables tracing across distributed systems and log aggregation
 * Uses AsyncLocalStorage for proper request isolation (prevents race conditions)
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if correlation ID already exists in headers (from upstream service)
  const existingId = req.headers["x-correlation-id"] as string;
  const correlationId = existingId || randomUUID();

  // Store correlation ID in request object for downstream access
  (req as RequestWithCorrelation).correlationId = correlationId;

  // Add correlation ID to response headers for debugging
  res.setHeader("X-Correlation-ID", correlationId);

  // Add W3C trace context if OpenTelemetry is active
  const span = trace.getActiveSpan();
  if (span) {
    const ctx = span.spanContext();
    const traceFlags = ctx.traceFlags.toString(16).padStart(2, "0");
    res.setHeader("traceparent", `00-${ctx.traceId}-${ctx.spanId}-${traceFlags}`);
  }

  // Run the request handler within AsyncLocalStorage context
  // This ensures correlation ID is isolated per request (no race conditions)
  correlationContext.run(correlationId, () => {
    // Cleanup on both finish and close events (handles aborted connections)
    const cleanup = () => {
      // Context automatically cleared when correlationContext.run() exits
    };

    res.once("finish", cleanup);
    res.once("close", cleanup);

    next();
  });
}
