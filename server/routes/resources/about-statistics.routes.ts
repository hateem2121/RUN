import { removeUndefined } from "../../lib/utilities/core-utils.js";

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
import { insertAboutStatisticSchema } from "../../../shared/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

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
      sortOrder: z.number().int().min(0),
    }),
  ),
});

/**
 * GET /api/v1/about-statistics
 * Retrieve all statistics
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getStatistics(), 10000, "Get about statistics");

  return result.match(
    (statistics) => {
      logger.info(`[AboutStatistics] Retrieved ${statistics.length} statistics`);
      return res.json(statistics);
    },
    (error) => {
      logger.error("[AboutStatistics] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * GET /api/v1/about-statistics/:id
 * Retrieve single statistic
 */
router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTimeout(aboutService.getStatistic(id), 10000, "Get about statistic");

  return result.match(
    (statistic) => {
      if (!statistic) {
        return res.status(404).json({ error: "Statistic not found" });
      }
      logger.info(`[AboutStatistics] Retrieved statistic ${id}`);
      return res.json(statistic);
    },
    (error) => {
      logger.error("[AboutStatistics] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * POST /api/v1/about-statistics
 * Create new statistic
 */
router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutStatisticSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutStatistics] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const result = await withTimeout(
    aboutService.createStatistic(removeUndefined(validation.data)),
    10000,
    "Create about statistic",
  );

  return result.match(
    (newStatistic) => {
      logger.info(`[AboutStatistics] Created statistic ${newStatistic.id}`);
      return res.status(201).json(newStatistic);
    },
    (error) => {
      logger.error("[AboutStatistics] Create failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-statistics/:id
 * Update statistic
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertAboutStatisticSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutStatistics] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const result = await withTimeout(
    aboutService.updateStatistic(id, removeUndefined(validation.data)),
    10000,
    "Update about statistic",
  );

  return result.match(
    (updatedStatistic) => {
      logger.info(`[AboutStatistics] Updated statistic ${id}`);
      return res.json(updatedStatistic);
    },
    (error) => {
      logger.error("[AboutStatistics] Update failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * DELETE /api/v1/about-statistics/:id
 * Delete statistic
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTimeout(
    aboutService.deleteStatistic(id),
    10000,
    "Delete about statistic",
  );

  return result.match(
    () => {
      logger.info(`[AboutStatistics] Deleted statistic ${id}`);
      return res.status(204).send();
    },
    (error) => {
      logger.error("[AboutStatistics] Delete failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-statistics/reorder
 * Reorder statistics
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutStatistics] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

  const result = await withTimeout(
    aboutService.reorderStatistics(orderedIds),
    15000,
    "Reorder about statistics",
  );

  return result.match(
    () => {
      logger.info(`[AboutStatistics] Reordered ${orderedIds.length} statistics`);
      return res.json({ success: true, updated: orderedIds.length });
    },
    (error) => {
      logger.error("[AboutStatistics] Reorder failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

export default router;
