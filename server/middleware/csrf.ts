/**
 * CSRF Protection Middleware
 * Implements Double-Submit Cookie pattern for stateless CSRF protection
 *
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

// Routes excluded from CSRF protection
const EXCLUDED_ROUTES = [
  "/api/auth/google", // OAuth flow
  "/api/auth/google/callback",
  "/api/health",
  "/api/health/detailed",
  "/api/docs",
  "/api-docs",
  "/api/webhooks", // External webhooks need their own verification
  "/api/debug", // Debug routes (guarded by token)
];

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Check if a route is excluded from CSRF protection
 */
function isExcludedRoute(path: string): boolean {
  return EXCLUDED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

/**
 * CSRF Token Generation Middleware
 * Ensures a CSRF token cookie is set on every response
 */
export function csrfTokenGenerator(req: Request, res: Response, next: NextFunction): void {
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
 * CSRF Validation Middleware
 * Validates CSRF token on state-changing requests (POST, PUT, PATCH, DELETE)
 */
export function csrfValidator(req: Request, res: Response, next: NextFunction): void {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  // Skip for excluded routes
  if (isExcludedRoute(req.path)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  // Validate both tokens exist and match
  if (!cookieToken || !headerToken) {
    logger.warn("[CSRF] Missing token", {
      path: req.path,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
    });
    res.status(403).json({
      error: "CSRF_TOKEN_MISSING",
      message: "CSRF token is required for this request",
    });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    logger.warn("[CSRF] Token mismatch", { path: req.path });
    res.status(403).json({
      error: "CSRF_TOKEN_INVALID",
      message: "CSRF token validation failed",
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
