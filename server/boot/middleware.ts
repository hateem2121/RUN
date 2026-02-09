import compression from "compression";
import cookieParser from "cookie-parser";
import type { Express } from "express";
import express from "express";
import { getConfig } from "../config/production.js";
import { httpMetricsTracker } from "../lib/monitoring/http-metrics.js";
import {
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
} from "../lib/monitoring/sentry.js";
import { apiVersioningMiddleware, canonicalMiddleware } from "../middleware/canonical.js";
import { correlationIdMiddleware } from "../middleware/correlation-id.js";
import { createCorsMiddleware } from "../middleware/cors-config.js";
import { csrfProtection } from "../middleware/csrf.js";
import { healthCheckHandler, quickHealthHandler } from "../middleware/enhanced-health.js";
import { nonceMiddleware } from "../middleware/nonce.js";
import { performanceTrackingMiddleware } from "../middleware/performance-tracking.js";
import {
  notFoundHandler,
  setupGlobalErrorHandlers,
} from "../middleware/production-error-handler.js";
import {
  productionLogging,
  requestTimeout,
  requestValidation,
  securityHeaders,
} from "../middleware/production-security.js";
import { apiLimiter, authLimiter, uploadLimiter } from "../middleware/rate-limits.js";
import { responseTracker } from "../middleware/response-tracker.js";

const config = getConfig();

export function setupMiddleware(app: Express) {
  // Trust Proxy - use hop count of 1 for Cloud Run (single load balancer)
  // This is more secure than `true` which trusts all X-Forwarded-* headers
  // Cloud Run uses a single load balancer, so we only trust 1 proxy hop
  app.set("trust proxy", 1);

  // Sentry Request Handler (Must be first middleware)
  // Only enable if SENTRY_DSN is configured
  if (process.env.SENTRY_DSN) {
    app.use(sentryRequestHandler);
    app.use(sentryTracingHandler);
  }

  // Phase 7: Express 5 Stability Fix
  // Track response state to prevent 404 fall-through race conditions
  app.use(responseTracker);

  // Global Error Handlers Setup
  setupGlobalErrorHandlers();

  // Cookie Parser (Required for CSRF)
  app.use(cookieParser());

  // Basic Security & Identity
  app.use(createCorsMiddleware());
  app.use(nonceMiddleware);

  // CSRF Protection (Double-Submit Cookie pattern)
  app.use(csrfProtection);

  // Security headers - enabled in all environments
  app.use(securityHeaders);
  app.use(requestValidation);

  const isProd = config.app.environment === "production" || process.env.NODE_ENV === "production";

  // Request timeout and production logging only in production
  if (isProd) {
    app.use(requestTimeout);
    app.use(productionLogging);
  }

  // Request Tracing & Canonicalization
  app.use(correlationIdMiddleware);
  app.use(canonicalMiddleware);
  app.use(apiVersioningMiddleware);

  // Metrics & Observability
  app.use(httpMetricsTracker.middleware());
  app.use(performanceTrackingMiddleware);

  // Granular Rate Limiting
  app.use("/api/auth", authLimiter.middleware());
  app.use("/api/media", uploadLimiter.middleware());
  app.use("/api", apiLimiter.middleware());

  // Compression
  configureCompression(app);

  // API Caching
  configureApiCaching(app);

  // Static Assets Cache Control (Production)
  if (config.app.environment === "production") {
    configureStaticCache(app);
  }

  // Request Body Parsers
  configureBodyParsers(app);

  // PHASE 3: Audit Logging for Admin Mutations
  // Log all state-changing operations in the admin panel
  app.use("/api/admin", (req, _res, next) => {
    // Only log mutations
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      import("../services/audit-log.js")
        .then(({ logAuditAction }) => {
          logAuditAction({
            actor: (req.user as any) || { id: "anonymous", email: "unknown" },
            action: req.method,
            target: { type: "API_ROUTE", id: req.path },
            metadata: { body_keys: Object.keys(req.body || {}) },
          });
        })
        // biome-ignore lint/suspicious/noConsole: audit log failure
        .catch((err) => console.error("Audit log failed", err));
    }
    next();
  });
}

export function setupErrorHandling(app: Express) {
  // 404 Handler
  app.use(notFoundHandler);

  // Sentry Error Handler (Must be before other error middleware)
  if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler);
  }

  // Final Global Error Handler (Project Rule #3)
  app.use(
    async (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Dynamic import to avoid circular dependencies during boot
      const { errorHandler } = await import("../middleware/errorHandler.js");
      errorHandler(err, req, res, next);
    },
  );
}

export function setupHealthChecks(app: Express) {
  app.get("/health", quickHealthHandler);
  // Protected health check configuration should be handled inside enhanced-health.ts
  app.get("/health/detailed", healthCheckHandler);
}

function configureCompression(app: Express) {
  app.use(
    compression({
      level: 9,
      threshold: 512,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }

        // Optimize: explicitly skip heavy binary formats that are already compressed
        // This saves CPU cycles on the server
        if (/\.(jpg|jpeg|png|webp|gif|mp4|webm|glb|gltf|woff|woff2|ttf|eot|otf)$/i.test(req.path)) {
          return false;
        }

        // Always compress text-based assets
        if (/\.(css|js|json|xml|svg)$/i.test(req.path)) {
          return true;
        }

        // Fallback to standard filter (checks Content-Type)
        return compression.filter(req, res);
      },
    }),
  );
}

// Phase 3: SWR Caching for Read-Heavy APIs
function configureApiCaching(app: Express) {
  const cacheMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    }
    next();
  };

  app.use("/api/categories", cacheMiddleware);
  app.use("/api/products", cacheMiddleware);
  app.use("/api/homepage-hero", cacheMiddleware);
}

function configureStaticCache(app: Express) {
  app.use("/src", (req, res, next) => {
    const ext = req.path.substring(req.path.lastIndexOf("."));
    const immutableAssets = [
      ".css",
      ".js",
      ".woff",
      ".woff2",
      ".ttf",
      ".otf",
      ".eot",
      ".glb",
      ".gltf",
    ];
    const imageAssets = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico"];

    if (immutableAssets.includes(ext)) {
      res.setHeader(
        "Cache-Control",
        "public, max-age=31536000, immutable, stale-while-revalidate=86400",
      );
      res.setHeader("ETag", `"static-${Date.now()}"`);
    } else if (imageAssets.includes(ext)) {
      res.setHeader("Cache-Control", "public, max-age=2592000, stale-while-revalidate=604800");
    }
    next();
  });
}

function configureBodyParsers(app: Express) {
  // Binary parser for chunks
  app.use(
    "/api/media/upload/chunk-raw",
    express.raw({
      type: "application/octet-stream",
      limit: "1gb",
    }),
  );

  // Standard parsers with limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false, limit: "10mb" }));
}
