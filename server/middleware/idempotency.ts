/**
 * Idempotency Middleware
 *
 * Clients may send an `Idempotency-Key` header (arbitrary string, ≤ 255 chars)
 * on any mutating request.  The first response for that key is cached in memory;
 * subsequent requests with the same key receive the cached response immediately,
 * avoiding duplicate side-effects (duplicate orders, duplicate emails, etc.).
 *
 * Rules:
 * - GET requests are skipped (already idempotent by HTTP spec).
 * - /api/health is skipped (diagnostic, never mutating).
 * - Keys without a cached entry are processed normally and the response cached.
 * - Replayed responses include an `Idempotent-Replayed: true` header.
 */

import type { NextFunction, Request, Response } from "express";

interface CachedEntry {
  status: number;
  body: unknown;
}

// In-memory store — replace with Redis for multi-instance deployments.
const store = new Map<string, CachedEntry>();

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip GETs — they are naturally idempotent
  if (req.method === "GET") {
    next();
    return;
  }

  // Skip the health endpoint
  if (req.path === "/api/health") {
    next();
    return;
  }

  const key = req.headers["idempotency-key"];
  if (!key || typeof key !== "string") {
    next();
    return;
  }

  // Replay cached response
  const cached = store.get(key);
  if (cached) {
    res.setHeader("Idempotent-Replayed", "true");
    res.status(cached.status).json(cached.body);
    return;
  }

  // Intercept the outgoing response and cache it
  const originalJson = res.json.bind(res) as typeof res.json;
  res.json = (body: unknown) => {
    store.set(key, { status: res.statusCode, body });
    return originalJson(body);
  };

  next();
}

/** Exposed for testing only — clear all cached entries. */
export function clearIdempotencyStore(): void {
  store.clear();
}

/** Exposed for testing only — inspect stored entries count. */
export function getIdempotencyStoreSize(): number {
  return store.size;
}
