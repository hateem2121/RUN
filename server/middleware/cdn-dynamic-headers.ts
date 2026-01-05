/**
 * CDN Headers Middleware for Dynamic Content
 *
 * Adds appropriate Cache-Control headers for SSR pages to enable
 * edge caching while ensuring freshness.
 *
 * Reference: https://web.dev/articles/stale-while-revalidate
 */

import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";

// CDN cache configuration by route type
const CDN_CONFIG = {
  // SSR pages - short cache with SWR
  default: {
    sMaxAge: 60, // 1 minute at edge
    staleWhileRevalidate: 600, // 10 minutes SWR
  },
  // Product pages - slightly longer cache
  products: {
    sMaxAge: 300, // 5 minutes at edge
    staleWhileRevalidate: 3600, // 1 hour SWR
  },
  // Category pages - longer cache
  categories: {
    sMaxAge: 600, // 10 minutes at edge
    staleWhileRevalidate: 3600, // 1 hour SWR
  },
  // Homepage - moderate cache
  homepage: {
    sMaxAge: 120, // 2 minutes at edge
    staleWhileRevalidate: 600, // 10 minutes SWR
  },
};

/**
 * Determine cache config based on request path
 */
function getCacheConfig(path: string): {
  sMaxAge: number;
  staleWhileRevalidate: number;
} {
  if (path === "/" || path === "/home") {
    return CDN_CONFIG.homepage;
  }
  if (path.startsWith("/products/") || path.startsWith("/product/")) {
    return CDN_CONFIG.products;
  }
  if (path.startsWith("/categories/") || path.startsWith("/category/")) {
    return CDN_CONFIG.categories;
  }
  return CDN_CONFIG.default;
}

/**
 * Routes that should NOT be cached (personalized/authenticated content)
 */
const NO_CACHE_PATTERNS = [
  /^\/api\//,
  /^\/admin/,
  /^\/cart/,
  /^\/checkout/,
  /^\/account/,
  /^\/auth/,
  /^\/login/,
  /^\/logout/,
];

function shouldSkipCache(path: string): boolean {
  return NO_CACHE_PATTERNS.some((pattern) => pattern.test(path));
}

/**
 * CDN Dynamic Headers Middleware
 *
 * Adds Cache-Control headers for CDN/edge caching of SSR content.
 * Uses s-maxage for shared caches (CDN) while keeping private caches minimal.
 */
export function cdnDynamicHeaders(req: Request, res: Response, next: NextFunction): void {
  // Skip for API routes, admin, and authenticated pages
  if (shouldSkipCache(req.path)) {
    next();
    return;
  }

  // Skip if user is authenticated (has session cookie)
  const hasSessionCookie = !!req.cookies?.["connect.sid"];
  if (hasSessionCookie) {
    res.setHeader("Cache-Control", "private, no-cache");
    res.setHeader("Vary", "Cookie");
    next();
    return;
  }

  // Get cache configuration for this route
  const config = getCacheConfig(req.path);

  // Set CDN-appropriate Cache-Control header
  // s-maxage: CDN cache duration
  // stale-while-revalidate: serve stale while fetching fresh
  // public: allow shared caches
  const cacheControl = [
    "public",
    `s-maxage=${config.sMaxAge}`,
    `stale-while-revalidate=${config.staleWhileRevalidate}`,
    "stale-if-error=86400", // Serve stale for 24h if origin errors
  ].join(", ");

  res.setHeader("Cache-Control", cacheControl);

  // Vary header ensures cache considers these request headers
  res.setHeader("Vary", "Accept-Encoding, Accept-Language");

  // Add debug header in non-production
  if (process.env.NODE_ENV !== "production") {
    res.setHeader(
      "X-CDN-Cache-Config",
      `s-maxage=${config.sMaxAge}, swr=${config.staleWhileRevalidate}`,
    );
  }

  next();
}

/**
 * Get CDN config for monitoring
 */
export function getCDNConfigs(): typeof CDN_CONFIG {
  return { ...CDN_CONFIG };
}

logger.info("[CDN Headers] ✅ Dynamic content CDN headers middleware initialized");
