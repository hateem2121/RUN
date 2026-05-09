// API-Based Population - Use existing endpoints to create data
// Creates all 47 business items using working API endpoints

import type { Express } from "express";
import { env } from "../../lib/env.js";
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";
import { populationService } from "../../services/population.service.js";

export function registerAPIBasedPopulationRoutes(app: Express): void {
  app.post("/api/api-based/populate-all", authService.requireAdmin, async (_req, res) => {
    // Defense-in-depth: Handlers MUST NOT run in production
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Operation not allowed in production" });
    }

    logger.debug("[API Population] 🚀 Creating all 47 business items via APIs...");

    const result = await populationService.populateApiBased(env.PORT || 5002);

    if (result.isErr()) {
      return res.status(500).json({ success: false, error: "API population failed" });
    }

    const results = result.value;

    const totalCreated =
      results.categories.length +
      results.fabrics.length +
      results.fibers.length +
      results.certificates.length +
      results.accessories.length;

    logger.debug(
      `[API Population] 🎉 Successfully created ${totalCreated} business items via APIs`,
    );

    return res.json({
      success: true,
      message: `Successfully created ${totalCreated} business items via API calls`,
      data: {
        summary: {
          categories: results.categories.length,
          fabrics: results.fabrics.length,
          fibers: results.fibers.length,
          certificates: results.certificates.length,
          accessories: results.accessories.length,
          total: totalCreated,
        },
        details: results,
      },
      timestamp: new Date().toISOString(),
    });
  });

  logger.debug("[API Population] ✅ API-based population routes registered");
}
