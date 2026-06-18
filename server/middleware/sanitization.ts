import type { NextFunction, Request, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import { logger } from "../lib/monitoring/logger.js";

/**
 * SANITIZATION MIDDLEWARE
 * Prevents NoSQL Injection and XSS attacks by sanitizing request data.
 */

// Combined Middleware
export function requestSanitization(req: Request, _res: Response, next: NextFunction) {
  // 1. NoSQL Injection Prevention (Legacy Support)
  try {
    if (req.body) {
      req.body = mongoSanitize.sanitize(req.body);
    }
    if (req.params) {
      try {
        req.params = mongoSanitize.sanitize(req.params);
      } catch (_e) {
        // Ignore read-only
      }
    }
    if (req.query) {
      try {
        req.query = mongoSanitize.sanitize(req.query);
      } catch (_e) {
        // Ignore read-only
      }
    }
  } catch (error) {
    logger.warn("[Sanitization] Failed to run NoSQL sanitizer", error);
  }

  // 2. Global XSS Prevention removed to support TipTap payloads.
  // XSS sanitization must now be handled at the individual service boundary
  // using Zod schemas and service-specific DOMPurify passes.
  next();
}
