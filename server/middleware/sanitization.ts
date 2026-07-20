import type { NextFunction, Request, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import { Result } from "neverthrow";
import { logger } from "../lib/monitoring/logger.js";

/**
 * SANITIZATION MIDDLEWARE
 * Prevents NoSQL Injection and XSS attacks by sanitizing request data.
 */

const safeSanitize = Result.fromThrowable(
  (data: unknown) => mongoSanitize.sanitize(data as Record<string, unknown> | unknown[]),
  (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
);

// Combined Middleware
export function requestSanitization(req: Request, _res: Response, next: NextFunction): void {
  // 1. NoSQL Injection Prevention (Legacy Support)
  if (req.body) {
    safeSanitize(req.body)
      .map((sanitized) => {
        req.body = sanitized;
        return undefined;
      })
      .mapErr((e) => {
        logger.warn("[Sanitization] Failed to run NoSQL sanitizer on body", e);
      });
  }

  if (req.params) {
    safeSanitize(req.params)
      .map((sanitized) => {
        Object.defineProperty(req, "params", {
          value: sanitized,
          writable: true,
          configurable: true,
        });
        return undefined;
      })
      .mapErr(() => undefined);
  }

  if (req.query) {
    safeSanitize(req.query)
      .map((sanitized) => {
        Object.defineProperty(req, "query", {
          value: sanitized,
          writable: true,
          configurable: true,
        });
        return undefined;
      })
      .mapErr(() => undefined);
  }

  // 2. Global XSS Prevention removed to support TipTap payloads.
  // XSS sanitization must now be handled at the individual service boundary
  // using Zod schemas and service-specific DOMPurify passes.
  next();
}
