/**
 * ABOUT STATISTICS RESOURCE ROUTER
 *
 * Modular Express Router for About Statistics management
 * Handles full CRUD + reorder operations for statistics
 *
 * Routes:
 * - GET    /api/v1/about-statistics           - List all statistics
 * - GET    /api/v1/about-statistics/:id       - Get single statistic
 * - POST   /api/v1/about-statistics           - Create new statistic
 * - PATCH  /api/v1/about-statistics/:id       - Update statistic
 * - DELETE /api/v1/about-statistics/:id       - Delete statistic
 * - PATCH  /api/v1/about-statistics/reorder   - Reorder statistics
 */

import { Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/smart-logger.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { insertAboutStatisticSchema } from "../../../shared/schema.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { requireAdmin } from "../../middleware/auth.js";
import { aboutService } from "../../services/about.service.js";

const router = Router();

// Param validation schema
const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

// Reorder validation schema
const reorderSchema = z.object({
  entries: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

/**
 * GET /api/v1/about-statistics
 * Retrieve all statistics
 */
router.get("/", async (_req, res) => {
  try {
    const statistics = await withTimeout(
      aboutService.getStatistics(),
      10000,
      "Get about statistics",
    );

    logger.info(`[AboutStatistics] Retrieved ${statistics.length} statistics`);
    return res.json(statistics);
  } catch (error) {
    logger.error("[AboutStatistics] Error getting statistics:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get statistics",
    });
  }
});

/**
 * GET /api/v1/about-statistics/:id
 * Retrieve single statistic
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const statistic = await aboutService.getStatistic(id);

    if (!statistic) {
      return res.status(404).json({ error: "Statistic not found" });
    }

    logger.info(`[AboutStatistics] Retrieved statistic ${id}`);
    return res.json(statistic);
  } catch (error) {
    logger.error("[AboutStatistics] Error getting statistic:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get statistic",
    });
  }
});

/**
 * POST /api/v1/about-statistics
 * Create new statistic
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const validation = insertAboutStatisticSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutStatistics] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const newStatistic = await withTimeout(
      aboutService.createStatistic(validation.data),
      10000,
      "Create about statistic",
    );

    if (!newStatistic) {
      throw new Error("Failed to create statistic");
    }

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutStatistics] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[AboutStatistics] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutStatistics] Created statistic ${newStatistic.id}`);
    return res.status(201).json(newStatistic);
  } catch (error) {
    logger.error("[AboutStatistics] Error creating statistic:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create statistic",
    });
  }
});

/**
 * PATCH /api/v1/about-statistics/:id
 * Update statistic
 */
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = insertAboutStatisticSchema.partial().safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutStatistics] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updatedStatistic = await withTimeout(
      aboutService.updateStatistic(id, validation.data),
      10000,
      "Update about statistic",
    );

    if (!updatedStatistic) {
      return res.status(404).json({ error: "Statistic not found" });
    }

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutStatistics] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[AboutStatistics] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutStatistics] Updated statistic ${id}`);
    return res.json(updatedStatistic);
  } catch (error) {
    logger.error("[AboutStatistics] Error updating statistic:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update statistic",
    });
  }
});

/**
 * DELETE /api/v1/about-statistics/:id
 * Delete statistic
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      aboutService.deleteStatistic(id),
      10000,
      "Delete about statistic",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Statistic not found" });
    }

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutStatistics] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[AboutStatistics] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutStatistics] Deleted statistic ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[AboutStatistics] Error deleting statistic:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete statistic",
    });
  }
});

/**
 * PATCH /api/v1/about-statistics/reorder
 * Reorder statistics
 */
router.patch("/reorder", requireAdmin, async (req, res) => {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutStatistics] Reorder validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Update positions
    const updates = await Promise.all(
      validation.data.entries.map(({ id, position }) =>
        aboutService.updateStatistic(id, { sortOrder: position }),
      ),
    );

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutStatistics] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[AboutStatistics] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutStatistics] Reordered ${updates.length} statistics`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[AboutStatistics] Error reordering statistics:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder statistics",
    });
  }
});

export default router;
