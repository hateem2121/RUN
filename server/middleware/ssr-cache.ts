/**
 * SSR EDGE CACHING MIDDLEWARE
 * Adds Cache-Control headers for public pages to enable CDN/edge caching
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 */

import type { NextFunction, Request, Response } from "express";

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
 * SSR Edge Caching Middleware
 *
 * Sets appropriate Cache-Control headers for SSR responses:
 * - Public pages: Cacheable at edge for 60s, stale-while-revalidate for 10min
 * - Private pages: no-cache, no-store
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

  // Set cache headers based on path
  if (isPublicCacheablePath(req.path)) {
    // Edge caching for public pages
    // s-maxage: edge/CDN cache time
    // max-age: browser cache time
    // stale-while-revalidate: serve stale while fetching fresh
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Vary", "Accept-Encoding, Cookie");
  } else {
    // No caching for dynamic/private content
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  }

  next();
}

// Export path utilities for testing
export { isPublicCacheablePath, PUBLIC_CACHEABLE_PATHS, PRIVATE_PATHS };
