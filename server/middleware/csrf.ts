/**
 * CSRF Protection Middleware
 * Implements Double-Submit Cookie pattern for stateless CSRF protection
 *
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

// Routes excluded from CSRF protection
const EXCLUDED_ROUTES = [
  "/contact", // Public form - handled by standard CSRF but allows initial render
  "/api/auth/google", // OAuth flow
  "/api/auth/google/callback",
  "/api/health",
  "/api/health/detailed",
  "/api/docs",
  "/api-docs",
  "/api/webhooks", // External webhooks need their own verification
  "/api/auth/mock-login", // E2E/Internal testing auth
  "/api/debug/crash", // Integration testing
  "/api/debug/slow-query", // Integration testing
  "/api/debug/ip-check", // Integration testing
  "/api/test/crash", // Integration testing
  "/api/inquiries", // Public inquiry/quote submission
  "/api/logs/error", // Client error logging endpoint
];

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * CSRF Token Generation Middleware
 * Ensures a CSRF token cookie is set on every response
 */
export function csrfTokenGenerator(req: Request, res: Response, next: NextFunction): void {
  // Bypassed for tests
  if ((req as unknown as { _skipCsrf?: boolean })._skipCsrf || res.headersSent) {
    next();
    return;
  }

  // Check if token already exists in cookies
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });
  }

  // Make token available in response locals for SSR rendering
  res.locals.csrfToken = token;

  next();
}

/**
 * Validate CSRF tokens
 * Returns null if valid, or an error object if invalid
 */
export function validateCsrfToken(
  cookieToken: string | undefined,
  providedToken: string | undefined,
): { error: string; message: string; status: number } | null {
  if (!cookieToken || !providedToken) {
    return {
      status: 403,
      error: "CSRF_TOKEN_MISSING",
      message: "CSRF token is required for this request",
    };
  }

  try {
    const cookieBuffer = Buffer.from(cookieToken);
    const tokenBuffer = Buffer.from(providedToken);

    if (
      cookieBuffer.length !== tokenBuffer.length ||
      !crypto.timingSafeEqual(cookieBuffer, tokenBuffer)
    ) {
      return {
        status: 403,
        error: "CSRF_TOKEN_INVALID",
        message: "CSRF token validation failed",
      };
    }
  } catch (_error) {
    return {
      status: 403,
      error: "CSRF_VALIDATION_ERROR",
      message: "An error occurred during CSRF validation",
    };
  }

  return null;
}

/**
 * CSRF Validation Middleware
 * Validates CSRF token on state-changing requests (POST, PUT, PATCH, DELETE)
 */
export function csrfValidator(req: Request, res: Response, next: NextFunction): void {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!isMutation) {
    next();
    return;
  }

  // Handle React Router .data suffixes for exclusion check
  const cleanPath = req.path.replace(/\.data$/, "");
  if (EXCLUDED_ROUTES.includes(cleanPath)) {
    next();
    return;
  }

  // Bypassed for tests
  if ((req as unknown as { _skipCsrf?: boolean })._skipCsrf) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers?.[CSRF_HEADER_NAME] as string | undefined;
  const bodyToken = (req.body?.csrf_token || req.body?.csrfToken) as string | undefined;

  const providedToken = headerToken || bodyToken;

  const csrfError = validateCsrfToken(cookieToken, providedToken);

  if (csrfError) {
    logger.warn("[CSRF] Validation failed", {
      path: req.path,
      ip: req.ip,
      error: csrfError.error,
    });

    res.status(csrfError.status).json({
      error: csrfError.error,
      message: csrfError.message,
    });
    return;
  }

  next();
}

/**
 * Combined CSRF middleware for convenience
 * Generates token on all requests, validates on mutations
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  csrfTokenGenerator(req, res, (err) => {
    if (err) {
      return next(err);
    }
    csrfValidator(req, res, next);
  });
}
