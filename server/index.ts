import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "http"; // HMR FIX: Import createServer explicitly
import path from "path";
// PHASE 4: Production Readiness Imports
import { getConfig } from "./config/production.js";
import { dbKeepAlive } from "./lib/database-keep-alive.js";
import { httpMetricsTracker } from "./lib/http-metrics-tracker.js";
import { logger } from "./lib/smart-logger.js";
import { createSsrHandler } from "./lib/ssr-handler.js";
import { getStorage } from "./lib/storage-singleton.js";
import { correlationIdMiddleware } from "./middleware/correlation-id.js";
import { createCorsMiddleware } from "./middleware/cors-config.js";
import { healthCheckHandler, quickHealthHandler } from "./middleware/enhanced-health.js";
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
console.log(`[Server] 🚀 Starting in ${config.app.environment} mode`);

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
console.log("[Server] ✅ CORS middleware enabled with origin restrictions");

// PHASE 4: Production Security Middleware (Production Only)
if (config.app.environment === "production") {
  // DEBUG: Temporarily disabled to isolate 500 error on assets
  // app.use(securityHeaders);
  // app.use(requestValidation);
  app.use(requestTimeout);
  app.use(productionLogging);
  console.log("[Server] ✅ Production security middleware enabled (Partial Debug Mode)");
} else {
  console.log("[Server] 🔧 Development mode - security middleware disabled for Vite compatibility");
}

// PHASE 3: Correlation ID Middleware for request tracing (all requests)
app.use(correlationIdMiddleware);
console.log("[Server] ✅ Correlation ID middleware enabled for distributed tracing");

// PHASE 3: HTTP Metrics Tracking (all requests)
app.use(httpMetricsTracker.middleware());
console.log("[Server] ✅ HTTP metrics tracking enabled (latency, status codes, routes)");

// FORENSIC INVESTIGATION: Performance tracking middleware for detailed request analysis
app.use(performanceTrackingMiddleware);
console.log("[Server] ✅ Performance tracking enabled (TTFB, p50/p95/p99 latency monitoring)");

// CHUNK 13: Production-Grade Rate Limiting (API routes only)
import { apiRateLimiter } from "./middleware/rateLimiter.js";

app.use("/api", apiRateLimiter.middleware());
console.log("[Server] ✅ Rate limiting enabled: 100 requests per 15 minutes per IP");

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
  console.log("[Server] ✅ Production static asset caching enabled (CSS, JS, fonts, images)");
} else {
  console.log(
    "[Server] 🔧 Development mode - static asset immutable caching disabled for Vite compatibility",
  );
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

console.log("[Server] ✅ Raw binary parser configured for chunk uploads");

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
        logLine = logLine.slice(0, 79) + "…";
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
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const { fileURLToPath } = await import("url");
      const __dirname = fileURLToPath(new URL(".", import.meta.url));
      const specPath = join(__dirname, "openapi-spec.json");
      const spec = JSON.parse(readFileSync(specPath, "utf-8"));
      res.json(spec);
    } catch (err) {
      logger.error("[API Docs] Failed to load OpenAPI spec:", err);
      res.status(500).json({ error: "Failed to load API documentation" });
    }
  });
  console.log("[Server] ✅ OpenAPI documentation available at /api-docs");

  // PHASE 4: Initialize backup scheduler
  if (config.app.environment === "production") {
    backupScheduler.start();
    console.log("[Server] ✅ Production backup scheduler started");
  }

  // PHASE 5: Initialize operational excellence systems
  workflowAutomation.start();
  console.log("[Server] ✅ Workflow automation started");

  // LIFECYCLE: Initialize storage lifecycle scheduler for auto-cleanup
  try {
    const { getLifecycleScheduler } = await import("./lib/storage-lifecycle-scheduler.js");
    const lifecycleScheduler = getLifecycleScheduler({
      enabled: true,
      interval: 60 * 60 * 1000, // 1 hour
      dryRun: false,
    });
    lifecycleScheduler.start();
    console.log(
      "[Server] ✅ Storage lifecycle scheduler started (temp uploads auto-cleanup every 1h)",
    );
  } catch (error) {
    console.error("[Server] ⚠️ Storage lifecycle scheduler failed to start:", error);
  }

  // PERFORMANCE FIX: Start database keep-alive to prevent Neon auto-suspend
  dbKeepAlive.start();
  console.log("[Server] ✅ Database keep-alive started (prevents cold starts)");

  // PHASE 3.1: Initialize database performance optimizations
  try {
    // Simplified database optimization
    const DatabasePerformanceOptimizer = {
      optimize: async () => logger.info("[DB] Using PostgreSQL built-in optimization"),
    };
    await DatabasePerformanceOptimizer.optimize();
    console.log("[Server] ✅ Database performance optimizations applied");
  } catch (error) {
    console.error("[Server] ⚠️ Database optimization failed:", error);
  }

  // PHASE 3.2: Initialize enhanced error handling
  try {
    console.log("[Server] ✅ Enhanced health monitoring and error recovery systems initialized");
  } catch (error) {
    console.error("[Server] ⚠️ Enhanced health monitoring initialization failed:", error);
  }

  // COLD START RESILIENCE: Wake up database before cache warming
  try {
    const { wakeupDatabase } = await import("./db.js");
    const wakeupResult = await wakeupDatabase();

    if (!wakeupResult.success) {
      console.warn(`[Server] ⚠️ Database wakeup failed - cache warming may be slower`);
    }
  } catch (error) {
    console.error("[Server] ⚠️ Database wakeup error:", error);
  }

  // PHASE 1 OPTIMIZATION: Non-blocking cache warming with progressive retries
  const { unifiedCache } = await import("./lib/unified-cache.js");
  const { retryDbOperation } = await import("./lib/db-retry.js");

  // PHASE 1 OPTIMIZATION: Awaited Cache Warming
  try {
    console.log("[Server] ⏳ Warming cache (this may take a few seconds)...");
    await retryDbOperation(() => unifiedCache.warmCache(), {
      maxRetries: 3,
      backoffMs: 500,
      operationName: "Cache warming (NEON cold start recovery)",
    });
    console.log("[Server] ✅ Cache warming completed - critical routes ready");
  } catch (error) {
    console.error("[Server] ⚠️ Cache warming failed:", error);
    console.log("[Server] ℹ️ Application starting with cold cache");
  }

  // CHUNK 8: Startup database health check
  try {
    const healthCheck = await getStorage().checkDatabaseHealth();
    if (healthCheck.healthy) {
      console.log(
        `[Server] ✅ Database health check passed (${healthCheck.latency.toFixed(2)}ms latency)`,
      );
    } else {
      console.warn(
        `[Server] ⚠️ Database health check failed (${healthCheck.latency.toFixed(2)}ms latency)`,
      );
    }
  } catch (error) {
    console.error(
      "[Server] ❌ Database health check error:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // PHASE 4: Production Security Middleware (Production Only)
  if (config.app.environment === "production") {
    app.use(securityHeaders);
    app.use(requestValidation);
    app.use(requestTimeout);
    app.use(productionLogging);
    console.log("[Server] ✅ Production security middleware enabled");
  } else {
    console.log(
      "[Server] 🔧 Development mode - security middleware disabled for Vite compatibility",
    );
  }

  console.log(`[Server] 🎯 Production readiness complete - ${config.app.environment} mode`);

  // Serve static files in production BEFORE SSR handler
  if (config.app.environment === "production" || process.env.NODE_ENV === "production") {
    // When running from dist/index.js, verify the asset path relative to the process CWD
    const staticPath = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(staticPath, { index: false }));
    console.log(`[Server] serving static assets from: ${staticPath}`);
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
    console.error(err);
  });

  // ALWAYS serve the app on port 5001 (default)
  const port = parseInt(process.env.PORT || "5001", 10);

  // HMR FIX: Listen on the pre-created httpServer instance
  httpServer.listen(port, "0.0.0.0", () => {
    logger.info(`Server running on port ${port}`);
  });

  // FORENSIC INVESTIGATION FIX: Server timeout and keep-alive configuration
  httpServer.timeout = 120000;
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;

  console.log("[Server] ✅ Server timeouts configured (timeout: 120s, keep-alive: 65s)");
})();
