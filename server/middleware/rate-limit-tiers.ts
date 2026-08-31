import type { Request } from "express";
import rateLimit from "express-rate-limit";

/**
 * TIERED RATE LIMITING SYSTEM (CodeQL & OpenSSF Hardened)
 *
 * Standardized rate limits for different API surfaces.
 * Built with standard 100% Free Open-Source express-rate-limit (MIT)
 * with draft-8 headers and environment-aware execution.
 *
 * Tiers:
 * - Public: Lax limits for content discovery (GET)
 * - Standard: Normal API operations (POST/PATCH/DELETE)
 * - Critical: Sensitive endpoints (Auth, Inquiries, Admin)
 * - Upload: Media and asset chunk uploads
 */

const shouldSkipRateLimiting = (_req: Request): boolean => {
  return (
    process.env.NODE_ENV === "development" ||
    (process.env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMIT_IN_TESTS !== "true") ||
    (process.env.E2E === "true" && process.env.ENABLE_RATE_LIMIT_IN_TESTS !== "true") ||
    (process.env.PLAYWRIGHT_TEST === "true" && process.env.ENABLE_RATE_LIMIT_IN_TESTS !== "true")
  );
};

/**
 * TIER 1: PUBLIC CONTENT (Lax)
 * Designed for public read-only pages and resource discovery.
 * 200 requests per 10 minutes.
 */
export const publicTier = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many content requests. Please slow down." },
  skip: shouldSkipRateLimiting,
  validate: { xForwardedForHeader: false, default: true },
});

/**
 * TIER 2: STANDARD API (Standard)
 * Designed for standard resource management and user interactions.
 * 60 requests per 1 minute.
 */
export const apiTier = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Standard API rate limit exceeded." },
  skip: shouldSkipRateLimiting,
  validate: { xForwardedForHeader: false, default: true },
});

/**
 * TIER 3: CRITICAL OPERATIONS (Strict)
 * Designed for authentication, contact forms, and admin actions.
 * 10 attempts per 15 minutes.
 */
export const criticalTier = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Sensitive operation limit exceeded. Please try again later for security." },
  skip: shouldSkipRateLimiting,
  validate: { xForwardedForHeader: false, default: true },
});

/**
 * TIER 4: ASSET UPLOAD (Dynamic)
 * Specialized limits for media and file uploads.
 * 20 uploads per 10 minutes.
 */
export const uploadTier = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Upload quota exceeded. Please wait before uploading more assets." },
  skip: shouldSkipRateLimiting,
  validate: { xForwardedForHeader: false, default: true },
});
