/**
 * Idempotency Middleware
 * Ensures POST/PUT/PATCH requests with the same Idempotency-Key return the same response
 *
 * Reference: https://stripe.com/docs/api/idempotent_requests
 */

import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";

const IDEMPOTENCY_HEADER = "idempotency-key";
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory store (for fallback or development)
// In production, this should be backed by Redis
interface IdempotencyEntry {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyEntry>();

// Routes excluded from idempotency (safe methods or special cases)
const EXCLUDED_ROUTES = ["/api/health", "/api/docs", "/api/auth"];

/**
 * Check if a route is excluded from idempotency checking
 */
function isExcludedRoute(path: string): boolean {
  return EXCLUDED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore.entries()) {
    if (now - entry.timestamp > IDEMPOTENCY_TTL) {
      idempotencyStore.delete(key);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

/**
 * Generate a unique key from the request
 * Combines idempotency key with method and path for uniqueness
 */
function generateStoreKey(idempotencyKey: string, method: string, path: string): string {
  return `${idempotencyKey}:${method}:${path}`;
}

/**
 * Idempotency Middleware
 * Stores and returns cached responses for duplicate requests
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to state-changing methods
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  // Skip excluded routes
  if (isExcludedRoute(req.path)) {
    return next();
  }

  const idempotencyKey = req.get(IDEMPOTENCY_HEADER);

  // If no idempotency key provided, continue without caching
  if (!idempotencyKey) {
    return next();
  }

  const storeKey = generateStoreKey(idempotencyKey, req.method, req.path);

  // Check if we have a cached response
  const cachedEntry = idempotencyStore.get(storeKey);
  if (cachedEntry) {
    // Check if entry is still valid
    if (Date.now() - cachedEntry.timestamp <= IDEMPOTENCY_TTL) {
      logger.info("[Idempotency] Returning cached response", {
        key: idempotencyKey,
        path: req.path,
      });

      // Set cached headers
      for (const [key, value] of Object.entries(cachedEntry.headers)) {
        res.set(key, value);
      }
      res.set("Idempotent-Replayed", "true");

      res.status(cachedEntry.status).json(cachedEntry.body);
      return;
    }
    // Entry expired, remove it
    idempotencyStore.delete(storeKey);
  }

  // Intercept the response to cache it
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const captureResponse = (body: unknown) => {
    // Only cache successful responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const entry: IdempotencyEntry = {
        status: res.statusCode,
        headers: {
          "Content-Type": res.get("Content-Type") || "application/json",
        },
        body,
        timestamp: Date.now(),
      };

      idempotencyStore.set(storeKey, entry);
      logger.debug("[Idempotency] Cached response", {
        key: idempotencyKey,
        path: req.path,
      });
    }
  };

  res.json = (body: unknown) => {
    captureResponse(body);
    return originalJson(body);
  };

  res.send = (body: unknown) => {
    // Only capture JSON responses
    if (typeof body === "object" && body !== null) {
      captureResponse(body);
    }
    return originalSend(body);
  };

  next();
}

/**
 * Get idempotency store metrics for monitoring
 */
export function getIdempotencyMetrics(): {
  entriesCount: number;
  oldestEntry: number | null;
} {
  let oldestTimestamp: number | null = null;

  for (const entry of idempotencyStore.values()) {
    if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
  }

  return {
    entriesCount: idempotencyStore.size,
    oldestEntry: oldestTimestamp,
  };
}

/**
 * Clear idempotency store (for testing)
 */
export function clearIdempotencyStore(): void {
  idempotencyStore.clear();
}
