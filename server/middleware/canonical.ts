import type { RequestHandler } from "express";

/**
 * Enforces canonical domain usage to prevent SEO dilution and session cookies issues.
 * redirects non-primary domains to the configured PRIMARY_HOST.
 */
export const canonicalMiddleware: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") return next();

  const host = req.get("host");
  const primaryHost = process.env.PRIMARY_HOST || "app.wear-run.com";

  // Skip if we are already on primary host or IP address access (health checks)
  // Also allow localhost for testing/local production preview
  if (host === primaryHost || host?.match(/^(\d+\.\d+\.\d+\.\d+|localhost)(:\d+)?$/)) {
    return next();
  }

  // Force HTTPS and Primary Host
  // X-Forwarded-Proto is set by Cloud Run / Load Balancer
  const protocol = req.get("X-Forwarded-Proto") || req.protocol;

  if (host !== primaryHost || protocol !== "https") {
    return res.redirect(301, `https://${primaryHost}${req.url}`);
  }

  next();
};

/**
 * API Versioning Middleware
 * rewrites /api/v1/* to /api/* internally for backward compatibility
 * while we transition.
 */
export const apiVersioningMiddleware: RequestHandler = (req, res, next) => {
  if (req.url.startsWith("/api/v1/")) {
    req.url = req.url.replace("/api/v1/", "/api/");
    return next();
  }

  // Reject future versions explicitly
  if (req.url.match(/^\/api\/v\d+\//)) {
    return res.status(400).json({
      error: "UNSUPPORTED_VERSION",
      message: "API version not supported. Please use v1.",
    });
  }

  next();
};
