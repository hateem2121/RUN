import { reorderEntriesSchema } from "@run-remix/shared";
import { Router } from "express";
import { insertAboutStatisticSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

/**
 * GET /api/v1/about-statistics
 * Retrieve all statistics
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getStatistics(), 10000, "Get about statistics");

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutStatistics] Retrieved ${result.value.length} statistics`);
  return res.json(result.value);
});

/**
 * GET /api/v1/about-statistics/:id
 * Retrieve single statistic
 */
router.get("/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Statistic");
  if (id === null) return;

  const result = await withTimeout(aboutService.getStatistic(id), 10000, "Get about statistic");

  if (result.isErr()) {
    throw result.error;
  }

  const statistic = result.value;
  if (!statistic) {
    throw new ValidationError(`Statistic ${id} not found`);
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
    throw new ValidationError("Invalid statistic data", { issues: validation.error.issues });
  }

  const result = await withTimeout(
    aboutService.createStatistic(removeUndefined(validation.data)),
    10000,
    "Create about statistic",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutStatistics] Created statistic ${result.value.id}`);
  return res.status(201).json(result.value);
});

/**
 * PATCH /api/v1/about-statistics/:id
 * Update statistic
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Statistic");
  if (id === null) return;

  const validation = insertAboutStatisticSchema.partial().safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid statistic update data", { issues: validation.error.issues });
  }

  const result = await withTimeout(
    aboutService.updateStatistic(id, removeUndefined(validation.data)),
    10000,
    "Update about statistic",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutStatistics] Updated statistic ${id}`);
  return res.json(result.value);
});

/**
 * DELETE /api/v1/about-statistics/:id
 * Delete statistic
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Statistic");
  if (id === null) return;

  const result = await withTimeout(
    aboutService.deleteStatistic(id),
    10000,
    "Delete about statistic",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutStatistics] Deleted statistic ${id}`);
  return res.status(204).send();
});

/**
 * PATCH /api/v1/about-statistics/reorder
 * Reorder statistics
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderEntriesSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid reorder data", { issues: validation.error.issues });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

  const result = await withTimeout(
    aboutService.reorderStatistics(orderedIds),
    15000,
    "Reorder about statistics",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutStatistics] Reordered ${orderedIds.length} statistics`);
  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
