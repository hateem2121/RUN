// Direct PostgreSQL Population - Bypass storage issues
// Creates all 47 business items directly in PostgreSQL

import type { Express } from "express";
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";
import { populationService } from "../../services/population.service.js";

export function registerDirectPostgresPopulationRoutes(app: Express): void {
  app.post("/api/direct-postgres/populate-all", authService.requireAdmin, async (_req, res) => {
    // Defense-in-depth: Handlers MUST NOT run in production
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Operation not allowed in production" });
    }

    logger.debug("[Direct PostgreSQL] 🚀 Populating all 47 business items directly...");

    const startTime = Date.now();

    const result = await populationService.populateDirectPostgres();
    if (result.isErr()) {
      return res.status(500).json({ success: false, error: "Population failed" });
    }

    const data = result.value;
    const duration = Date.now() - startTime;
    const totalCreated =
      data.categories.length +
      data.fabrics.length +
      data.fibers.length +
      data.certificates.length +
      data.accessories.length;

    logger.debug(
      `[Transaction] Direct PostgreSQL population completed in ${duration}ms (${totalCreated} items across 5 tables)`,
    );

    return res.json({
      success: true,
      message: `Successfully populated PostgreSQL with ${totalCreated} business items`,
      data: {
        summary: {
          categories: data.categories.length,
          fabrics: data.fabrics.length,
          fibers: data.fibers.length,
          certificates: data.certificates.length,
          accessories: data.accessories.length,
          total: totalCreated,
        },
        details: data,
      },
      timestamp: new Date().toISOString(),
    });
  });

  logger.debug("[Direct PostgreSQL] ✅ Direct PostgreSQL population routes registered");
}
