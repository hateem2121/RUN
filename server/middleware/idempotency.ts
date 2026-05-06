/**
 * Idempotency Middleware
 *
 * Clients may send an `Idempotency-Key` header (arbitrary string, ≤ 255 chars)
 * on any mutating request. The first response for that key is cached;
 * subsequent requests with the same key receive the cached response immediately,
 * avoiding duplicate side-effects (duplicate orders, duplicate emails, etc.).
 *
 * This version is hardened for production using UnifiedCache (Hybrid L1/L2).
 *
 * Rules:
 * - GET requests are skipped (already idempotent by HTTP spec).
 * - /api/health is skipped (diagnostic, never mutating).
 * - Keys without a cached entry are processed normally and the response cached.
 * - Replayed responses include an `Idempotent-Replayed: true` header.
 */

import type { NextFunction, Request, Response } from "express";
import { UnifiedCache, unifiedCache } from "../lib/cache/unified-cache.js";

interface CachedEntry {
  status: number;
  body: unknown;
}

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Skip GETs — they are naturally idempotent
  if (req.method === "GET") {
    return next();
  }

  // Skip the health endpoint
  if (req.path === "/api/health") {
    return next();
  }

  const key = req.headers["idempotency-key"];
  if (!key || typeof key !== "string") {
    return next();
  }

  const cacheKey = `idempotency:${key}`;

  try {
    // Replay cached response
    const cached = await unifiedCache.get<CachedEntry>(cacheKey);
    if (cached) {
      res.setHeader("Idempotent-Replayed", "true");
      res.status(cached.status).json(cached.body);
      return;
    }

    // Intercept the outgoing response and cache it
    const originalJson = res.json.bind(res) as typeof res.json;
    res.json = (body: unknown) => {
      // Background cache write (fire-and-forget in UnifiedCache.set)
      unifiedCache.set(cacheKey, { status: res.statusCode, body }, UnifiedCache.TTL_PRESETS.STATIC);
      return originalJson(body);
    };

    next();
  } catch (error) {
    // Fail safe: if cache errors, proceed with normal execution
    // but log the error
    console.error("[Idempotency] Cache error:", error);
    next();
  }
}

/** Exposed for testing only — clear all cached entries matching the prefix. */
export async function clearIdempotencyStore(): Promise<void> {
  await unifiedCache.invalidate("idempotency:");
}

/**
 * Exposed for testing only — inspect stored entries count.
 * Note: This only returns L1 (memory) stats.
 */
export function getIdempotencyStoreSize(): number {
  return unifiedCache.getStats().itemCount;
}
