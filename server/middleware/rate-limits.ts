import { RateLimiter } from "./rateLimiter.js";

// Standard API Limiter (1000 req / 15 min)
export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many API requests, please try again later.",
  statusCode: 429,
});

// Strict Auth Limiter for Login/Register (5 attempts / 15 min)
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
  statusCode: 429,
});

// Upload Limiter for Media (10 uploads / hour)
export const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Upload limit exceeded, please try again later.",
  statusCode: 429,
});
