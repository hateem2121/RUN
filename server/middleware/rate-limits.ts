import type { NextFunction, Request, Response } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import { logger } from "../lib/monitoring/logger.js";

/**
 * API Rate Limiter (Global)
 * Standard protection against brute-force and DoS attacks
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    if (process.env.NODE_ENV !== "production") return true;
    if (req.path === "/health" || req.path.startsWith("/src")) return true;
    return false;
  },
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    logger.warn(`[RateLimit] IP ${req.ip} exceeded API rate limit`);
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: "You have exceeded the request limit. Please try again later.",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * Auth Rate Limiter
 * Stricter limits for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Limit each IP to 20 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    logger.warn(`[RateLimit] IP ${req.ip} exceeded auth rate limit`);
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: "Too many login attempts. Please try again later.",
    });
  },
});

/**
 * Upload Rate Limiter
 * Prevent storage abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Limit uploads
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    logger.warn(`[RateLimit] IP ${req.ip} exceeded upload limit`);
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: "Upload limit exceeded.",
    });
  },
});
