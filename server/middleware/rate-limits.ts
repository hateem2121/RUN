import { getConfig } from "../config/production.js";
import { RateLimiter } from "./rateLimiter.js";

const config = getConfig();

// Standard API Limiter
export const apiLimiter = new RateLimiter({
  windowMs: config.security.rateLimiting.windowMs,
  max: config.security.rateLimiting.maxRequests,
  message: "Too many API requests, please try again later.",
  statusCode: 429,
});

// Strict Auth Limiter for Login/Register (Default: 5 (dev) or 5 (prod))
// Can be overridden by RATELIMIT_AUTH_MAX
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max:
    process.env.NODE_ENV === "development"
      ? 1000
      : parseInt(process.env.RATELIMIT_AUTH_MAX || "5", 10),
  message: "Too many login attempts, please try again later.",
  statusCode: 429,
});

// Upload Limiter for Media
export const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATELIMIT_UPLOAD_MAX || "10", 10),
  message: "Upload limit exceeded, please try again later.",
  statusCode: 429,
});
