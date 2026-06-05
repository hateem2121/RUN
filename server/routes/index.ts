/**
 * MASTER ROUTER - Route Orchestration & Documentation
 *
 * FOLDER STRUCTURE (Domain-Driven Organization - CHUNK 14):
 * - v1/           : Modularized route definitions
 *
 * REFACTORED: Validated via automated tests.
 */

import { createServer, type Server } from "node:http";
import compression from "compression";
import { type Express, type Request, type Response, Router } from "express";
import { logger } from "../lib/monitoring/logger.js";
import { diagnosticLimiter } from "../lib/resilience/rate-limiter.js";
import { apiTier, criticalTier, publicTier, uploadTier } from "../middleware/rate-limit-tiers.js";
import v1AdminRouter from "./admin/admin.js";
import authRouter from "./auth.js";
// V1 Modular Routers
import v1CoreRouter from "./core/index.js";
import debugRouter from "./debug.js";
import docsRouter from "./docs.js";
import v1MediaRouter from "./media/index.js";
import resourcesRouter from "./resources/index.js";
import analyticsRouter from "./utilities/analytics.js";
// Utilities / Populators
import { registerAPIBasedPopulationRoutes } from "./utilities/api-based-population.js";
import { registerDataCreationRoutes } from "./utilities/data-creation.js";
import { registerDirectPostgresPopulationRoutes } from "./utilities/direct-postgres-population.js";
import footerConfigRouter from "./utilities/footer-config.js";
import inquiryAdminRouter from "./utilities/inquiry-admin.js";
import { registerKVDiagnosticsRoutes } from "./utilities/kv-diagnostics.js";
import logsRouter from "./utilities/logs.js";
import { registerMetricsRoutes } from "./utilities/metrics.js";
import { registerNewsletterRoutes } from "./utilities/newsletter.js";
import workerRouter from "./worker.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Auth is initialized in boot/middleware.ts

  // ============================================================================
  // DEV TOOLS (Development only)
  // ============================================================================
  if (process.env.NODE_ENV !== "production") {
    const { default: devRouter } = await import("./dev.js");
    app.use("/api/dev", devRouter);
  }

  app.use(
    compression({
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        if (res.get("Content-Type")?.includes("application/json")) {
          return true;
        }
        if (res.get("Content-Type")?.includes("text/")) {
          return true;
        }
        return compression.filter(req, res);
      },
    }),
  );

  logger.info("[Routes] Mounting API routes with flat structure (/api/*)");

  // ============================================================================
  // ROUTE REGISTRATION - VERSIONING STRUCTURE (Phase 4)
  // ============================================================================

  const apiRouter = Router();

  // Debug logging — development only to avoid production log noise
  if (process.env.NODE_ENV !== "production") {
    apiRouter.use((req, _res, next) => {
      logger.info(`[Router Debug] API Router hit: ${req.method} ${req.url}`);
      next();
    });
  }

  apiRouter.get("/", (_req, res) => {
    res.json({
      status: "ok",
      version: "v1",
      docs: "/api/docs",
    });
  });

  // 1. Auth & Worker (Root Level)
  apiRouter.use("/auth", criticalTier, authRouter);
  apiRouter.use("/worker", apiTier, workerRouter);
  apiRouter.use("/inquiry-admin", criticalTier, inquiryAdminRouter);

  // 1.5 Resources (Public Page Content - Must be before Admin/Core to avoid conflicts)
  apiRouter.use(publicTier, resourcesRouter);
  apiRouter.use(publicTier, footerConfigRouter);

  // 2. Core Business Domains
  apiRouter.use(apiTier, v1CoreRouter);

  // 3. Admin & Media Management
  apiRouter.use("/admin", criticalTier, v1AdminRouter);
  apiRouter.use("/media", uploadTier, v1MediaRouter);

  // 4. Utilities
  apiRouter.use("/analytics", analyticsRouter);
  apiRouter.use("/logs", logsRouter);

  // ARCH-001 FIX: Single canonical API mount
  app.use("/api", apiRouter);

  // Legacy v1 redirect for backward compatibility
  app.use("/api/v1", (req, res) => {
    const newUrl = req.originalUrl.replace("/api/v1", "/api");
    res.redirect(308, newUrl);
  });

  // Documentation (Keep at /api/docs)
  app.use("/api/docs", docsRouter);

  // Debug (Development only, gated internally)
  if (process.env.NODE_ENV !== "production") {
    app.use("/api/debug", debugRouter);
  }

  // Utilities / Functions (Direct app mounting for special cases)

  // Metrics (Production-safe, read-only)
  registerMetricsRoutes(app);

  // DEV-ONLY: KV Diagnostics & Data Population (NEVER in production)
  if (process.env.NODE_ENV !== "production") {
    app.use("/api/kv-direct", diagnosticLimiter.middleware());
    app.use("/api/kv-diagnostics", diagnosticLimiter.middleware());
    registerKVDiagnosticsRoutes(app);
    registerDataCreationRoutes(app);
    registerDirectPostgresPopulationRoutes(app);
    registerAPIBasedPopulationRoutes(app);
  }

  registerNewsletterRoutes(app);

  logger.info("[Routes] ✅ All routes registered successfully (Centralized Auth)");

  return httpServer;
}
