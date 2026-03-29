import type { NextFunction, Request, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";

/**
 * SANITIZATION MIDDLEWARE
 * Prevents NoSQL Injection and XSS attacks by sanitizing request data.
 */

// 1. NoSQL Injection Prevention
// 1. NoSQL Injection Prevention
// We will manually apply this to ensure we handle read-only properties gracefully

// 2. XSS Prevention
// Recursively sanitizes strings in an object against XSS
function sanitizeObject<T>(obj: T): T {
  if (!obj) return obj;

  if (typeof obj === "string") {
    return xss(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const cleanObj = {} as Record<string, unknown>;
    for (const key of Object.keys(obj as object)) {
      cleanObj[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
    }
    return cleanObj as unknown as T;
  }

  return obj;
}

export function xssSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    try {
      req.body = sanitizeObject(req.body);
    } catch (_e) {
      // Ignore if read-only
    }
  }
  if (req.query) {
    try {
      req.query = sanitizeObject(req.query);
    } catch (_e) {
      // Ignore if read-only
    }
  }
  if (req.params) {
    try {
      req.params = sanitizeObject(req.params);
    } catch (_e) {
      // Ignore if read-only
    }
  }
  next();
}

// Combined Middleware
export function requestSanitization(req: Request, res: Response, next: NextFunction) {
  // 1. NoSQL Injection Prevention
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
    console.warn("[Sanitization] Failed to run NoSQL sanitizer:", error);
  }

  // 2. XSS Prevention
  xssSanitizer(req, res, next);
}
