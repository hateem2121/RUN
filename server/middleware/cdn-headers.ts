/**
 * CDN Headers Middleware
 * Optimizes caching for Cloud CDN/Edge networks
 *
 * Reference: https://cloud.google.com/cdn/docs/caching
 */

import type { NextFunction, Request, Response } from "express";

// CDN cache TTL configurations
const CDN_CACHE_CONFIG = {
  // Static assets (images, fonts, CSS, JS bundles)
  static: {
    cdnTtl: 86400 * 7, // 7 days at edge
    browserTtl: 86400, // 1 day in browser
    staleWhileRevalidate: 86400, // 1 day stale-while-revalidate
  },
  // API responses (public, cacheable)
  api: {
    cdnTtl: 60, // 1 minute at edge
    browserTtl: 30, // 30 seconds in browser
    staleWhileRevalidate: 120, // 2 minutes stale-while-revalidate
  },
  // HTML pages (for SSR)
  html: {
    cdnTtl: 300, // 5 minutes at edge
    browserTtl: 0, // No browser caching (revalidate)
    staleWhileRevalidate: 600, // 10 minutes stale-while-revalidate
  },
};

/**
 * Determine content type category from response
 */
function getContentCategory(
  contentType: string | undefined,
  path: string,
): keyof typeof CDN_CACHE_CONFIG {
  if (!contentType) return "html";

  if (
    contentType.includes("image/") ||
    contentType.includes("font/") ||
    contentType.includes("application/javascript") ||
    contentType.includes("text/css") ||
    path.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico)$/i)
  ) {
    return "static";
  }

  if (contentType.includes("application/json")) {
    return "api";
  }

  return "html";
}

/**
 * CDN Headers Middleware
 * Sets optimal cache headers for CDN edge caching
 */
export function cdnHeaders(req: Request, res: Response, next: NextFunction): void {
  // Skip for authenticated/personalized requests
  if (req.isAuthenticated?.() || req.get("Authorization")) {
    res.set("Cache-Control", "private, no-store");
    res.set("Vary", "Authorization, Cookie");
    next();
    return;
  }

  // Hook into response to set headers after content-type is determined
  const originalSend = res.send.bind(res);

  res.send = (body: unknown) => {
    const contentType = res.get("Content-Type");
    const category = getContentCategory(contentType, req.path);
    const config = CDN_CACHE_CONFIG[category];

    // Standard Cache-Control
    if (config.browserTtl > 0) {
      res.set(
        "Cache-Control",
        `public, max-age=${config.browserTtl}, stale-while-revalidate=${config.staleWhileRevalidate}`,
      );
    } else {
      res.set(
        "Cache-Control",
        `public, max-age=0, must-revalidate, stale-while-revalidate=${config.staleWhileRevalidate}`,
      );
    }

    // CDN-specific headers (Google Cloud CDN, Cloudflare, Fastly)
    res.set("CDN-Cache-Control", `max-age=${config.cdnTtl}`);
    res.set("Surrogate-Control", `max-age=${config.cdnTtl}`);

    // Proper Vary headers for cache keying
    const varyHeaders = ["Accept-Encoding"];
    if (category === "api") {
      varyHeaders.push("Accept");
    }
    if (category === "html") {
      varyHeaders.push("Accept", "Accept-Language");
    }
    res.set("Vary", varyHeaders.join(", "));

    return originalSend(body);
  };

  next();
}

/**
 * Bypass CDN cache for specific requests
 * Useful for preview/draft content
 */
export function bypassCdnCache(_req: Request, res: Response, next: NextFunction): void {
  res.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.set("CDN-Cache-Control", "no-store");
  res.set("Surrogate-Control", "no-store");
  res.set("Pragma", "no-cache");
  next();
}

/**
 * Immutable static asset caching
 * For versioned/hashed assets that never change
 */
export function immutableCache(_req: Request, res: Response, next: NextFunction): void {
  // 1 year cache with immutable flag
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.set("CDN-Cache-Control", "max-age=31536000");
  res.set("Surrogate-Control", "max-age=31536000");
  next();
}
