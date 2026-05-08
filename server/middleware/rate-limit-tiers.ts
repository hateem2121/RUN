import { createRateLimiter } from "./rateLimiter.js";

/**
 * TIERED RATE LIMITING SYSTEM
 *
 * Standardized rate limits for different API surfaces.
 * Leverages Redis (Upstash) with an in-memory fallback for high availability.
 *
 * Tiers:
 * - Public: Lax limits for content discovery (GET)
 * - Standard: Normal API operations (POST/PATCH/DELETE)
 * - Critical: Sensitive endpoints (Auth, Inquiries, Admin)
 */

/**
 * TIER 1: PUBLIC CONTENT (Lax)
 * Designed for public read-only pages and resource discovery.
 * 200 requests per 10 minutes.
 */
export const publicTier = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: "Too many content requests. Please slow down.",
});

/**
 * TIER 2: STANDARD API (Standard)
 * Designed for standard resource management and user interactions.
 * 60 requests per 1 minute.
 */
export const apiTier = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Standard API rate limit exceeded.",
});

/**
 * TIER 3: CRITICAL OPERATIONS (Strict)
 * Designed for authentication, contact forms, and admin actions.
 * 5 attempts per 15 minutes.
 */
export const criticalTier = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Sensitive operation limit exceeded. Please try again later for security.",
});

/**
 * TIER 4: ASSET UPLOAD (Dynamic)
 * Specialized limits for media and file uploads.
 * 20 uploads per 10 minutes.
 */
export const uploadTier = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Upload quota exceeded. Please wait before uploading more assets.",
});
