/**
 * SSR EDGE CACHING MIDDLEWARE
 * Adds Cache-Control headers for public pages to enable CDN/edge caching.
 * Includes server-side HTML caching at the origin level (PC-102).
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 */

import type { NextFunction, Request, Response } from "express";
import { unifiedCache } from "../lib/cache/unified-cache.js";
import { logger } from "../lib/monitoring/logger.js";

// Public pages that can be cached at the edge
const PUBLIC_CACHEABLE_PATHS = [
  "/",
  "/products",
  "/about",
  "/sustainability",
  "/technology",
  "/manufacturing",
  "/contact",
];

// Pages with dynamic content should not be cached
const PRIVATE_PATHS = ["/admin", "/api", "/auth"];

/**
 * PC-102: Server-side HTML cache at the origin level.
 * Prevents redundant SSR renders for identical public pages.
 * Delegated to UnifiedCache for L1/L2 coordination.
 */
const HTML_CACHE_TTL = 60; // 60 seconds

/**
 * PC-101: Generates a Vary-aware cache key.
 * Includes user role to prevent cross-user data leakage.
 */
function getCacheKey(req: Request): string {
  const user = (req as Request & { user?: { role?: string } }).user;
  const role = user?.role || "anon";

  // Include query parameters for key stability if filters are used
  const queryString =
    Object.keys(req.query).length > 0
      ? `?${new URLSearchParams(req.query as Record<string, string>).toString()}`
      : "";

  return `ssr:${role}:${req.path}${queryString}`;
}

/**
 * Determines if a path is publicly cacheable
 */
function isPublicCacheablePath(path: string): boolean {
  // Never cache private paths
  if (PRIVATE_PATHS.some((prefix) => path.startsWith(prefix))) {
    return false;
  }

  // Check exact matches first
  if (PUBLIC_CACHEABLE_PATHS.includes(path)) {
    return true;
  }

  // Check product detail pages: /products/:slug
  if (path.startsWith("/products/") && !path.includes("/admin")) {
    return true;
  }

  // Check category pages: /category/:slug
  if (path.startsWith("/category/")) {
    return true;
  }

  return false;
}

/**
 * PC-101: Check if the request is from an authenticated admin session.
 * Checks for session cookie presence and admin indicators.
 */
function isAdminSession(req: Request): boolean {
  // Check for admin session via Passport (populated by auth middleware)
  const user = (req as Request & { user?: { role?: string } }).user;
  if (user?.role === "admin") return true;

  // Fallback: Check referer header for admin panel navigation
  const referer = req.headers.referer || "";
  if (referer.includes("/admin")) return true;

  return false;
}

/**
 * SSR Edge Caching Middleware
 *
 * Sets appropriate Cache-Control headers for SSR responses:
 * - Public pages: Cacheable at edge for 60s, stale-while-revalidate for 10min
 * - Private pages: no-cache, no-store
 * - Admin sessions: Always private (PC-101)
 * - Server-side HTML caching for public anonymous requests (PC-102)
 *
 * @example
 * app.use(ssrCacheMiddleware);
 * app.use(ssrHandler); // Must come after
 */
export async function ssrCacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Only apply to GET requests (SSR pages)
  if (req.method !== "GET") {
    next();
    return;
  }

  // Skip API routes (handled separately)
  if (req.path.startsWith("/api/")) {
    next();
    return;
  }

  // PC-101: Admin sessions always get private, no-cache headers
  if (isAdminSession(req)) {
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    next();
    return;
  }

  // Set cache headers based on path
  if (isPublicCacheablePath(req.path)) {
    // Edge caching for public pages
    // s-maxage: edge/CDN cache time
    // max-age: browser cache time
    // stale-while-revalidate: serve stale while fetching fresh
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Vary", "Accept-Encoding, Cookie");

    // PC-102: Serve from server-side HTML cache if available (L1/L2 aware)
    const cacheKey = getCacheKey(req);
    logger.debug(`[SSR-Cache] Checking cache for ${cacheKey}`);
    const cached = await unifiedCache.get<{ html: string; headers: Record<string, string> }>(
      cacheKey,
    );

    if (cached) {
      logger.info(`[SSR-Cache] HIT for ${cacheKey}`);
      // Restore cached headers
      for (const [key, value] of Object.entries(cached.headers)) {
        res.setHeader(key, value);
      }
      res.setHeader("X-SSR-Cache", "HIT");
      res.send(cached.html);
      return;
    }

    // Intercept res.send to capture rendered HTML for caching
    res.setHeader("X-SSR-Cache", "MISS");
    const originalSend = res.send.bind(res);
    res.send = ((body: unknown): Response => {
      // Only cache successful HTML responses
      if (res.statusCode === 200 && typeof body === "string" && body.includes("<!DOCTYPE")) {
        logger.info(
          `[SSR-Cache] Setting cache for ${cacheKey} (${Buffer.byteLength(body, "utf8")} bytes)`,
        );
        unifiedCache
          .set(
            cacheKey,
            {
              html: body,
              headers: {
                "Content-Type": res.getHeader("Content-Type")?.toString() || "text/html",
              },
            },
            HTML_CACHE_TTL,
          )
          .catch((err) => logger.warn(`[SSR-Cache] Failed to set cache for ${cacheKey}`, err));
      }
      return originalSend(body);
    }) as typeof res.send;
  } else {
    // No caching for dynamic/private content
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  }

  next();
}

/**
 * Invalidate the server-side HTML cache.
 * Called by CacheOperations when CMS content changes.
 */
export async function invalidateHtmlCache(pattern?: string): Promise<void> {
  if (!pattern) {
    await unifiedCache.clearPattern("ssr:");
    logger.info("[SSR-Cache] HTML cache fully cleared");
    return;
  }

  await unifiedCache.invalidate(`ssr:.*${pattern}.*`);
  logger.info(`[SSR-Cache] HTML cache invalidated matching pattern: "${pattern}"`);
}

// Export path utilities for testing
export { isPublicCacheablePath, PUBLIC_CACHEABLE_PATHS, PRIVATE_PATHS };
