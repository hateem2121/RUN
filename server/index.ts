import { createServer } from "node:http"; // HMR FIX: Import createServer explicitly
import path from "node:path";
import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
// PHASE 4: Production Readiness Imports
import { startOtel } from "./lib/otel.js";

startOtel();

import { getConfig } from "./config/production.js";
import { dbKeepAlive } from "./lib/database-keep-alive.js";
import { httpMetricsTracker } from "./lib/http-metrics-tracker.js";
import { logger } from "./lib/smart-logger.js";
import { createSsrHandler } from "./lib/ssr-handler.js";
import { getStorage } from "./lib/storage-singleton.js";
import { correlationIdMiddleware } from "./middleware/correlation-id.js";
import { createCorsMiddleware } from "./middleware/cors-config.js";
import { healthCheckHandler, quickHealthHandler } from "./middleware/enhanced-health.js";
import { nonceMiddleware } from "./middleware/nonce.js";
// generalLimiter replaced by middleware/rateLimiter
import { performanceTrackingMiddleware } from "./middleware/performance-tracking.js";
import {
  notFoundHandler,
  productionErrorHandler,
  setupGlobalErrorHandlers,
} from "./middleware/production-error-handler.js";
import {
  productionLogging,
  requestTimeout,
  requestValidation,
  securityHeaders,
} from "./middleware/production-security.js";
import { registerRoutes } from "./routes/index.js";

// ============================================================================
// SIMPLIFIED SERVICES (replacing archived files)
// ============================================================================

// Simplified backup scheduler (replacing archived backup-recovery.js)
const backupScheduler = {
  start: async () =>
    logger.info("[Backup] Using PostgreSQL automatic backups - enhanced backup archived"),
  stop: async () => logger.info("[Backup] Backup scheduler stopped"),
};

// Simplified services (replacing archived operational excellence files)

const workflowAutomation = {
  start: async () =>
    logger.info("[Workflow] Using simplified automation - enhanced workflow archived"),
};

const app = express();

// CHUNK 13: Trust proxy for accurate IP detection behind load balancers/CDNs
app.set("trust proxy", true);

// PHASE 4: Initialize production configuration
const config = getConfig();

// PHASE 5: Sentry Initialization (Must be first)
import {
  initSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
} from "./lib/sentry.js";

initSentry();

// The request handler must be the first middleware on the app
app.use(sentryRequestHandler);
app.use(sentryTracingHandler);

// PHASE 4: Setup global error handlers
setupGlobalErrorHandlers();

// CHUNK 8: CORS Security - Restrict allowed origins to production domain
app.use(createCorsMiddleware());

// Security: Generate Nonce for every request (used by CSP and SSR)
// MUST run before securityHeaders
app.use(nonceMiddleware);

// PHASE 4: Production Security Middleware (Production Only)
if (config.app.environment === "production") {
  // DEBUG: Temporarily disabled to isolate 500 error on assets
  app.use(securityHeaders);
  app.use(requestValidation);
  app.use(requestTimeout);
  app.use(productionLogging);
} else {
}

// PHASE 3: Correlation ID Middleware for request tracing (all requests)
app.use(correlationIdMiddleware);

// PHASE 3: HTTP Metrics Tracking (all requests)
app.use(httpMetricsTracker.middleware());

// FORENSIC INVESTIGATION: Performance tracking middleware for detailed request analysis
app.use(performanceTrackingMiddleware);

// CHUNK 13: Production-Grade Rate Limiting (API routes only)
import { apiRateLimiter } from "./middleware/rateLimiter.js";

app.use("/api", apiRateLimiter.middleware());

// Enhanced compression with static asset optimization
app.use(
  compression({
    level: 9, // Maximum compression for better performance
    threshold: 512, // Compress smaller responses for better efficiency
    filter: (req, res) => {
      // Don't compress already compressed files or media proxies
      if (req.headers["x-no-compression"] || req.path.includes("/api/media/")) {
        return false;
      }
      // Enhanced compression for CSS/JS assets
      if (req.path.endsWith(".css") || req.path.endsWith(".js")) {
        return true;
      }
      return compression.filter(req, res);
    },
  }),
);

// Static asset optimization middleware (Production Only)
if (config.app.environment === "production") {
  app.use("/src", (req, res, next) => {
    // Enhanced caching headers for static assets
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
} else {
}

// CRITICAL FIX: Raw binary parser for chunk uploads BEFORE restrictive global parsers
// This prevents global JSON/urlencoded parsers from rejecting application/octet-stream
app.use(
  "/api/media/upload/chunk-raw",
  express.raw({
    type: "application/octet-stream",
    limit: "1gb",
  }),
);

// CHUNK 13: Configure Express body parsers with production-ready size limits
app.use(express.json({ limit: "10mb" })); // 10MB limit for JSON payloads (production-ready)
app.use(express.urlencoded({ extended: false, limit: "10mb" })); // 10MB limit for URL-encoded data

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = `${logLine.slice(0, 79)}…`;
      }

      logger.info(logLine); // Replaced 'log' with 'logger.info'
    }
  });

  next();
});

(async () => {
  // HMR FIX: Create HTTP server early to attach Vite HMR
  const httpServer = createServer(app);

  await registerRoutes(app);

  // PHASE 4: Enhanced health check endpoints
  app.get("/health", quickHealthHandler);
  app.get("/health/detailed", healthCheckHandler);

  // OpenAPI/Swagger Documentation
  app.get("/api-docs", async (_req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      const { readFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      const { fileURLToPath } = await import("node:url");
      const __dirname = fileURLToPath(new URL(".", import.meta.url));
      const specPath = join(__dirname, "openapi-spec.json");
      const spec = JSON.parse(readFileSync(specPath, "utf-8"));
      res.json(spec);
    } catch (err) {
      logger.error("[API Docs] Failed to load OpenAPI spec:", err);
      res.status(500).json({ error: "Failed to load API documentation" });
    }
  });

  // PHASE 4: Initialize backup scheduler
  if (config.app.environment === "production") {
    backupScheduler.start();
  }

  // PHASE 5: Initialize operational excellence systems
  workflowAutomation.start();

  // LIFECYCLE: Initialize storage lifecycle scheduler for auto-cleanup
  try {
    const { getLifecycleScheduler } = await import("./lib/storage-lifecycle-scheduler.js");
    const lifecycleScheduler = getLifecycleScheduler({
      enabled: true,
      interval: 60 * 60 * 1000, // 1 hour
      dryRun: false,
    });
    lifecycleScheduler.start();
  } catch (_error) {}

  // PERFORMANCE FIX: Start database keep-alive to prevent Neon auto-suspend
  dbKeepAlive.start();

  // PHASE 3.1: Initialize database performance optimizations
  try {
    // Simplified database optimization
    const DatabasePerformanceOptimizer = {
      optimize: async () => logger.info("[DB] Using PostgreSQL built-in optimization"),
    };
    await DatabasePerformanceOptimizer.optimize();
  } catch (_error) {}

  // PHASE 3.2: Initialize enhanced error handling
  try {
  } catch (_error) {}

  // COLD START RESILIENCE: Wake up database before cache warming
  try {
    const { wakeupDatabase } = await import("./db.js");
    const wakeupResult = await wakeupDatabase();

    if (!wakeupResult.success) {
    }
  } catch (_error) {}

  // PHASE 1 OPTIMIZATION: Non-blocking cache warming with progressive retries
  const { unifiedCache } = await import("./lib/unified-cache.js");
  const { retryDbOperation } = await import("./lib/db-retry.js");

  // PHASE 1 OPTIMIZATION: Awaited Cache Warming
  try {
    await retryDbOperation(() => unifiedCache.warmCache(), {
      maxRetries: 3,
      backoffMs: 500,
      operationName: "Cache warming (NEON cold start recovery)",
    });
  } catch (_error) {}

  // CHUNK 8: Startup database health check
  try {
    const healthCheck = await getStorage().checkDatabaseHealth();
    if (healthCheck.healthy) {
    } else {
    }
  } catch (_error) {}

  // Serve static files in production BEFORE SSR handler
  if (config.app.environment === "production" || process.env.NODE_ENV === "production") {
    // When running from dist/index.js, verify the asset path relative to the process CWD
    const staticPath = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(staticPath, { index: false }));
  }

  // Setup SSR handler (handles both Dev Vite and Prod SSR)
  // HMR FIX: Pass httpServer to ssrHandler so Vite can attach
  const ssrHandler = await createSsrHandler(app, httpServer);
  app.use(ssrHandler);

  // Error handling - if SSR didn't handle it
  app.use((_req, res, _next) => {
    res.status(404).send("Not Found");
  });

  // PHASE 4: Production error handling (AFTER frontend setup)
  app.use(notFoundHandler);

  // The error handler must be before any other error middleware and after all controllers
  app.use(sentryErrorHandler);

  app.use(productionErrorHandler);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // ALWAYS serve the app on port 5001 (default)
  const port = parseInt(process.env.PORT || "5001", 10);

  // HMR FIX: Listen on the pre-created httpServer instance
  httpServer.listen(port, "0.0.0.0", () => {
    logger.info(`Server running on port ${port}`);
    logger.info(`Booting run-remix-b2b in ${process.env.NODE_ENV || "development"} mode`);
    if (process.env.DEBUG) {
      logger.info(`DEBUG mode active: ${process.env.DEBUG}`);
    }
  });

  // FORENSIC INVESTIGATION FIX: Server timeout and keep-alive configuration
  httpServer.timeout = 120000;
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;
})();
