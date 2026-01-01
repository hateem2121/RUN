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
 * REFACTORED: Uses Dynamic Imports for startup performance and circular dependency avoidance.
 */

import { createServer, type Server } from "node:http";
import compression from "compression";
import type { Express } from "express";
import { logger } from "../lib/monitoring/logger.js";
import { getStorage } from "../lib/storage-singleton.js";

// Critical static imports for type safety and base middleware
// Note: We import setupAuth dynamically to ensure module isolation if needed,
// but usually auth setup is core. We'll keep it dynamic to be consistent.

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ============================================================================
  // CRITICAL MIDDLEWARE & AUTH
  // ============================================================================
  const { authService } = await import("../services/auth-service.js");
  const { adminLimiter, diagnosticLimiter } = await import("../lib/rate-limiter.js");
  const { enforceValidation } = await import("../middleware/strict-validation.js");

  authService.setup(app);
  logger.info("[Auth] ✅ AuthService initialized (OIDC + PostgreSQL sessions)");

  // ============================================================================
  // DEV LOGIN (Preserved for compatibility)
  // ============================================================================
  app.get("/api/dev/login", async (req, res) => {
    if (process.env.NODE_ENV === "production") return res.status(404).send("Not found");
    try {
      const { db } = await import("../db.js");
      const { users } = await import("@run-remix/shared");
      const { eq } = await import("drizzle-orm");

      const adminUser = await db.query.users.findFirst({
        where: eq(users.email, "team@wear-run.com"),
      });

      if (!adminUser) return res.status(404).json({ error: "Admin user not found" });

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
    compression({
      level: 6,
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
  // DYNAMIC MODULE LOADING (Parallelized)
  // ============================================================================
  let dynamicImportsResult: any[] = [];

  const importWithLog = async (path: string) => {
    try {
      console.log(`[Routes] Importing ${path}...`);
      const mod = await import(path);
      console.log(`[Routes] Imported ${path}`);
      return mod;
    } catch (e) {
      console.error(`[Routes] Failed to import ${path}:`, e);
      throw e;
    }
  };

  try {
    dynamicImportsResult = await Promise.all([
      importWithLog("./core/categories.js"),
      importWithLog("./core/products.js"),
      importWithLog("./core/fabrics.js"),
      importWithLog("./core/accessories.js"),
      importWithLog("./core/certificates.js"),
      importWithLog("./core/materials.js"),
      importWithLog("./core/size-charts.js"),

      importWithLog("./feature-flags.js"),
      importWithLog("./inquiries.js"),
      importWithLog("./media/folder-management.routes.js"),
      importWithLog("./media/index.js"),
      importWithLog("./resources/content-management-routes.js"),
      importWithLog("./resources/index.js"),
      importWithLog("./resources/page-content-routes.js"),
      importWithLog("./auth.js"),
      importWithLog("./admin/admin.js"),
      importWithLog("./worker.js"),
      importWithLog("./utilities/inquiry-admin.js"),
      importWithLog("./utilities/footer-config.js"),
      importWithLog("./utilities/api-based-population.js"),
      importWithLog("./utilities/data-creation.js"),
      importWithLog("./utilities/direct-postgres-population.js"),
      importWithLog("./utilities/kv-diagnostics.js"),
      importWithLog("./utilities/metrics.js"),
      importWithLog("./utilities/migration-execution.js"),
      importWithLog("./docs.js"),
    ]);
  } catch (error) {
    logger.error("[Start] Failed to import routes:", error);
    throw error;
  }

  const [
    // Core
    { default: categoriesRouter },
    { default: productsRouter },
    { default: fabricsRouter },
    { default: accessoriesRouter },
    { default: certificatesRouter },
    { default: materialsRouter },
    { default: sizeChartsRouter },
    // Utilities

    { default: featureFlagsRouter },
    { inquiryRoutes },
    // Media
    { default: foldersRouter },
    { default: mediaRoutes },
    // Resources
    { default: contentManagementRouter },
    { default: resourceRouter },
    { default: pageContentRouter },
    // Auth & Admin
    { default: authRouter },
    { default: adminRouter },
    // Workers & Misc
    { default: workerRouter },
    { default: inquiryAdminRouter },
    { default: footerConfigRouter },
    // Populators / Diagnostics
    { registerAPIBasedPopulationRoutes },
    { registerDataCreationRoutes },
    { registerDirectPostgresPopulationRoutes },
    { registerKVDiagnosticsRoutes },
    { registerMetricsRoutes },
    { registerMigrationExecutionRoutes },
    { default: docsRouter },
  ] = dynamicImportsResult;

  // ============================================================================
  // ROUTE REGISTRATION
  // ============================================================================

  // Auth & Admin Base
  app.use("/api", authRouter);
  app.use("/api/admin", authService.requireAdmin);
  app.use("/api/admin", adminLimiter.middleware());
  app.use("/api/admin", enforceValidation);

  // Core
  app.use("/api", categoriesRouter);
  app.use("/api", productsRouter);
  app.use("/api", fabricsRouter);
  app.use("/api", accessoriesRouter);
  app.use("/api", certificatesRouter);
  app.use("/api", materialsRouter);
  app.use("/api", sizeChartsRouter);
  app.use("/api", inquiryRoutes);

  // Media
  app.use("/api/media", mediaRoutes);
  app.use("/api", foldersRouter);

  // Resource Management
  app.use("/api", adminRouter);
  app.use("/api", inquiryAdminRouter);
  app.use(footerConfigRouter);
  app.use("/api/feature-flags", featureFlagsRouter);

  // Content
  app.use("/api", pageContentRouter);
  app.use("/api", contentManagementRouter);

  // Worker
  app.use("/api", workerRouter);

  // Client-facing Resources
  app.use("/api", resourceRouter);

  // Documentation
  app.use("/api/docs", docsRouter);

  // Utilities / Functions

  registerMigrationExecutionRoutes(app);

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
