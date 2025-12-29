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
import { logger } from "../lib/smart-logger.js";
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
    { registerTaxonomyRoutes },
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
  ] = await Promise.all([
    import("./core/categories.js"),
    import("./core/products.js"),
    import("./core/fabrics.js"),
    import("./core/accessories.js"),
    import("./core/certificates.js"),
    import("./core/materials.js"),
    import("./core/size-charts.js"),
    import("./core/taxonomy-routes.js"),
    import("./feature-flags.js"),
    import("./inquiries.js"),
    import("./media/folder-management.routes.js"),
    import("./media/index.js"),
    import("./resources/content-management-routes.js"),
    import("./resources/index.js"),
    import("./resources/page-content-routes.js"),
    import("./auth.js"),
    import("./admin/admin.js"),
    import("./worker.js"),
    import("./utilities/inquiry-admin.js"),
    import("./utilities/footer-config.js"),
    import("./utilities/api-based-population.js"),
    import("./utilities/data-creation.js"),
    import("./utilities/direct-postgres-population.js"),
    import("./utilities/kv-diagnostics.js"),
    import("./utilities/metrics.js"),
    import("./utilities/migration-execution.js"),
    import("./docs.js"),
  ]);

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
  registerTaxonomyRoutes(app);
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
