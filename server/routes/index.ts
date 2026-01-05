/**
 * MASTER ROUTER - Route Orchestration & Documentation
 *
 * FOLDER STRUCTURE (Domain-Driven Organization - CHUNK 14):
 * - core/         : Business entities
 * - admin/        : Admin panel operations
 * - utilities/    : Diagnostics, metrics, migrations
 * - resources/    : CMS content
 * - media/        : Media management
 *
 * REFACTORED: Uses STATIC Imports execution (via server.ts bootstrap) for better type safety.
 */

import { createServer, type Server } from "node:http";
import shrinkRay from "shrink-ray-current"; // Brotli support
import { type Express, Router } from "express";
import { logger } from "../lib/monitoring/logger.js";
import {
  adminLimiter,
  diagnosticLimiter,
} from "../lib/resilience/rate-limiter.js";
import { enforceValidation } from "../middleware/strict-validation.js";
// Static Imports (Safe thanks to bootstrap.ts secret loading)
import { authService } from "../services/auth-service.js";
import adminRouter from "./admin/admin.js";
// Auth & Admin
import authRouter from "./auth.js";
import accessoriesRouter from "./core/accessories.js";
// Core
import categoriesRouter from "./core/categories.js";
import certificatesRouter from "./core/certificates.js";
import fabricsRouter from "./core/fabrics.js";
import materialsRouter from "./core/materials.js";
import productsRouter from "./core/products.js";
import sizeChartsRouter from "./core/size-charts.js";
import docsRouter from "./docs.js";
// Utilities
import featureFlagsRouter from "./feature-flags.js";
import debugRouter from "./debug.js";
import { inquiryRoutes } from "./inquiries.js";
// Media
import foldersRouter from "./media/folder-management.routes.js";
import mediaRoutes from "./media/index.js";
// Resources
import contentManagementRouter from "./resources/content-management-routes.js";
import resourceRouter from "./resources/index.js";
import pageContentRouter from "./resources/page-content-routes.js";
// Populators / Diagnostics
import { registerAPIBasedPopulationRoutes } from "./utilities/api-based-population.js";
import { registerDataCreationRoutes } from "./utilities/data-creation.js";
import { registerDirectPostgresPopulationRoutes } from "./utilities/direct-postgres-population.js";
import footerConfigRouter from "./utilities/footer-config.js";
import inquiryAdminRouter from "./utilities/inquiry-admin.js";
import { registerKVDiagnosticsRoutes } from "./utilities/kv-diagnostics.js";
import { registerMetricsRoutes } from "./utilities/metrics.js";
import { registerMigrationExecutionRoutes } from "./utilities/migration-execution.js";
// Workers & Misc
import workerRouter from "./worker.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ============================================================================
  // CRITICAL MIDDLEWARE & AUTH
  // ============================================================================
  await authService.setup(app);
  logger.info(
    "[Auth] ✅ AuthService initialized (OIDC + Redis/PostgreSQL sessions)",
  );

  // ============================================================================
  // DEV LOGIN (Preserved for compatibility)
  // ============================================================================
  app.get("/api/dev/login", async (req, res) => {
    if (process.env.NODE_ENV === "production")
      return res.status(404).send("Not found");
    try {
      const { db } = await import("../db.js");
      const { users } = await import("@run-remix/shared");
      const { eq } = await import("drizzle-orm");

      const adminUser = await db.query.users.findFirst({
        where: eq(users.email, "team@wear-run.com"),
      });

      if (!adminUser)
        return res.status(404).json({ error: "Admin user not found" });

      const user = { claims: { sub: adminUser.id, email: adminUser.email } };
      return req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        return res.json({ success: true, message: "Logged in as admin", user });
      });
    } catch (error) {
      return res.status(500).json({ error: String(error) });
    }
  });

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

  // Core Domains
  apiRouter.use((req, _res, next) => {
    logger.info(`[Router Debug] API Router hit: ${req.method} ${req.url}`);
    next();
  });
  apiRouter.use(authRouter);
  apiRouter.use(categoriesRouter);
  apiRouter.use(productsRouter);
  apiRouter.use(fabricsRouter);
  apiRouter.use(accessoriesRouter);
  apiRouter.use(certificatesRouter);
  apiRouter.use(materialsRouter);
  apiRouter.use(sizeChartsRouter);
  apiRouter.use(inquiryRoutes);

  // Admin & Resources
  apiRouter.use(
    "/admin",
    authService.requireAdmin,
    adminLimiter.middleware(),
    enforceValidation,
  );
  apiRouter.use(adminRouter);

  apiRouter.use(inquiryAdminRouter);
  apiRouter.use(footerConfigRouter);
  apiRouter.use("/feature-flags", featureFlagsRouter);
  apiRouter.use("/debug", debugRouter);

  // Media
  apiRouter.use("/media", mediaRoutes);
  apiRouter.use(foldersRouter);

  // Content
  apiRouter.use(pageContentRouter);
  apiRouter.use(contentManagementRouter);

  // Worker
  apiRouter.use(workerRouter);

  // Client Resources
  apiRouter.use(resourceRouter);

  // MOUNT API ROUTER (Versioning)
  // Support both /api (legacy) and /api/v1 (future-proof)
  app.use("/api/v1", apiRouter);
  app.use("/api", apiRouter);

  // Documentation (Keep at /api/docs)
  app.use("/api/docs", docsRouter);

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

  logger.info(
    "[Routes] ✅ All routes registered successfully (Centralized Auth)",
  );

  return httpServer;
}
