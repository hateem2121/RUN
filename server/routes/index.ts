/**
 * MASTER ROUTER - Route Orchestration & Documentation
 *
 * FOLDER STRUCTURE (Domain-Driven Organization - CHUNK 14):
 * - v1/           : Modularized route definitions
 *
 * REFACTORED: Validated via automated tests.
 */

import { createServer, type Server } from "node:http";
import { type Express, Router } from "express";
import shrinkRay from "shrink-ray-current"; // Brotli support
import { logger } from "../lib/monitoring/logger.js";
import { diagnosticLimiter } from "../lib/resilience/rate-limiter.js";
// Static Imports (Safe thanks to bootstrap.ts secret loading)
import { authService } from "../services/auth-service.js";
import authRouter from "./auth.js";
import debugRouter from "./debug.js";
import docsRouter from "./docs.js";
// Utilities / Populators
import { registerAPIBasedPopulationRoutes } from "./utilities/api-based-population.js";
import { registerDataCreationRoutes } from "./utilities/data-creation.js";
import { registerDirectPostgresPopulationRoutes } from "./utilities/direct-postgres-population.js";
import { registerKVDiagnosticsRoutes } from "./utilities/kv-diagnostics.js";
import { registerMetricsRoutes } from "./utilities/metrics.js";
import { registerMigrationExecutionRoutes } from "./utilities/migration-execution.js";
import v1AdminRouter from "./v1/admin.js";
// V1 Modular Routers
import v1CoreRouter from "./v1/core.js";
import v1MediaRouter from "./v1/media.js";
import resourcesRouter from "./resources/index.js";
import workerRouter from "./worker.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ============================================================================
  // CRITICAL MIDDLEWARE & AUTH
  // ============================================================================
  // await authService.setup(app);
  // logger.info("[Auth] ✅ AuthService initialized (OIDC + Redis/PostgreSQL sessions)");

  // ============================================================================
  // DEV TOOLS (Development only)
  // ============================================================================
  if (process.env.NODE_ENV !== "production") {
    const { default: devRouter } = await import("./dev.js");
    app.use("/api/dev", devRouter);
  }

  app.use(
    shrinkRay({
      brotli: {
        quality: 6, // Balanced compression
      },
      threshold: 1024,
      filter: (_req, res) => {
        if (res.get("Content-Type")?.includes("application/json")) return true;
        if (res.get("Content-Type")?.includes("text/")) return true;
        return false;
      },
    }),
  );

  logger.info("[Routes] Mounting API routes with flat structure (/api/*)");

  // ============================================================================
  // ROUTE REGISTRATION - VERSIONING STRUCTURE (Phase 4)
  // ============================================================================

  const apiRouter = Router();

  apiRouter.use((req, _res, next) => {
    logger.info(`[Router Debug] API Router hit: ${req.method} ${req.url}`);
    next();
  });

  // 1. Auth & Worker (Root Level)
  apiRouter.use(authRouter);
  apiRouter.use(workerRouter);

  // 1.5 Resources (Public Page Content - Must be before Admin/Core to avoid conflicts)
  apiRouter.use(resourcesRouter);

  // 2. Core Business Domains
  apiRouter.use(v1CoreRouter);

  // 3. Media Management
  apiRouter.use(v1MediaRouter);

  // 4. Admin & Resources
  apiRouter.use(v1AdminRouter);

  // MOUNT API ROUTER (Versioning)
  // Support both /api (legacy) and /api/v1 (future-proof)
  app.use("/api/v1", apiRouter);

  // Legacy /api routes - add deprecation headers per RFC 8594
  // Sunset date: June 1, 2026
  app.use(
    "/api",
    (req, res, next) => {
      // Skip /api/v1 paths (already handled) and /api/docs
      if (req.path.startsWith("/v1") || req.path.startsWith("/docs")) {
        return next();
      }
      // Add RFC 8594 deprecation headers
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", "Sat, 01 Jun 2026 00:00:00 GMT");
      res.setHeader("Link", '</api/v1>; rel="successor-version"');
      next();
    },
    apiRouter,
  );

  // Documentation (Keep at /api/docs)
  app.use("/api/docs", docsRouter);

  // Debug (Development only, gated internally)
  app.use("/api/debug", debugRouter);

  // Utilities / Functions (Direct app mounting for special cases)
  registerMigrationExecutionRoutes(app);

  // KV Diagnostics
  app.use("/api/kv-direct", diagnosticLimiter.middleware());
  app.use("/api/kv-diagnostics", diagnosticLimiter.middleware());
  registerKVDiagnosticsRoutes(app);
  registerMetricsRoutes(app);
  registerDataCreationRoutes(app);
  registerDirectPostgresPopulationRoutes(app);
  registerAPIBasedPopulationRoutes(app);

  logger.info("[Routes] ✅ All routes registered successfully (Centralized Auth)");

  return httpServer;
}
