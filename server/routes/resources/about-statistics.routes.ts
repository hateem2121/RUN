import { removeUndefined } from "../../utils.js";

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
      position: z.number().int().min(0),
    }),
  ),
});

/**
 * GET /api/v1/about-statistics
 * Retrieve all statistics
 */
router.get("/", async (_req, res) => {
  const statistics = await withTimeout(aboutService.getStatistics(), 10000, "Get about statistics");

  logger.info(`[AboutStatistics] Retrieved ${statistics.length} statistics`);
  return res.json(statistics);
});

/**
 * GET /api/v1/about-statistics/:id
 * Retrieve single statistic
 */
router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const statistic = await aboutService.getStatistic(id);

  if (!statistic) {
    return res.status(404).json({ error: "Statistic not found" });
  }

  logger.info(`[AboutStatistics] Retrieved statistic ${id}`);
  return res.json(statistic);
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

  const newStatistic = await withTimeout(
    aboutService.createStatistic(removeUndefined(validation.data)),
    10000,
    "Create about statistic",
  );

  if (!newStatistic) {
    throw new Error("Failed to create statistic");
  }

  // Invalidation handled by service layer
  logger.info(`[AboutStatistics] Created statistic ${newStatistic.id}`);
  return res.status(201).json(newStatistic);
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

  const updatedStatistic = await withTimeout(
    aboutService.updateStatistic(id, removeUndefined(validation.data)),
    10000,
    "Update about statistic",
  );

  if (!updatedStatistic) {
    return res.status(404).json({ error: "Statistic not found" });
  }

  // Invalidation handled by service layer
  logger.info(`[AboutStatistics] Updated statistic ${id}`);
  return res.json(updatedStatistic);
});

/**
 * DELETE /api/v1/about-statistics/:id
 * Delete statistic
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    aboutService.deleteStatistic(id),
    10000,
    "Delete about statistic",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Statistic not found" });
  }

  // Invalidation handled by service layer
  logger.info(`[AboutStatistics] Deleted statistic ${id}`);
  return res.status(204).send();
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

  // Update positions
  const updates = await Promise.all(
    removeUndefined(validation.data).entries.map(({ id, position }) =>
      aboutService.updateStatistic(id, { sortOrder: position }),
    ),
  );

  // Invalidation handled by service layer
  logger.info(`[AboutStatistics] Reordered ${updates.length} statistics`);
  return res.json({ success: true, updated: updates.length });
});

export default router;
