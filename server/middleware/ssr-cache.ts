/**
 * SSR EDGE CACHING MIDDLEWARE
 * Adds Cache-Control headers for public pages to enable CDN/edge caching.
 * Includes server-side HTML caching at the origin level (PC-102).
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 */

import type { NextFunction, Request, Response } from "express";
import { LRUCache } from "lru-cache";
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
 * - Max 50 entries (one per unique public path)
 * - 60s TTL (matches browser max-age)
 * - Max 50MB memory
 */
const htmlCache = new LRUCache<string, { html: string; headers: Record<string, string> }>({
  max: 50,
  ttl: 60 * 1000, // 60 seconds
  maxSize: 50 * 1024 * 1024, // 50MB
  sizeCalculation: (value) => Buffer.byteLength(value.html, "utf8"),
});

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
export function ssrCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
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

    // PC-102: Serve from server-side HTML cache if available
    const cacheKey = `ssr:${req.path}`;
    const cached = htmlCache.get(cacheKey);
    if (cached) {
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
    res.send = function (body: unknown): Response {
      // Only cache successful HTML responses
      if (res.statusCode === 200 && typeof body === "string" && body.includes("<!DOCTYPE")) {
        htmlCache.set(cacheKey, {
          html: body,
          headers: {
            "Content-Type": res.getHeader("Content-Type")?.toString() || "text/html",
          },
        });
      }
      return originalSend(body);
    } as typeof res.send;
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
export function invalidateHtmlCache(pattern?: string): void {
  if (!pattern) {
    htmlCache.clear();
    logger.info("[SSR-Cache] HTML cache fully cleared");
    return;
  }

  let cleared = 0;
  for (const key of htmlCache.keys()) {
    if (key.includes(pattern)) {
      htmlCache.delete(key);
      cleared++;
    }
  }
  logger.info(`[SSR-Cache] HTML cache cleared ${cleared} entries matching "${pattern}"`);
}

// Export path utilities for testing
export { isPublicCacheablePath, PUBLIC_CACHEABLE_PATHS, PRIVATE_PATHS };
