import type { NextFunction, Request, Response } from "express";

/**
 * SANITIZATION MIDDLEWARE
 * Prevents XSS attacks by sanitizing request data.
 */

// Combined Middleware
export function requestSanitization(_req: Request, _res: Response, next: NextFunction): void {
  // Global XSS Prevention removed to support TipTap payloads.
  // XSS sanitization must now be handled at the individual service boundary
  // using Zod schemas and service-specific DOMPurify passes.
  next();
}
