import { Router } from "express";
import { z } from "zod";
import { insertAboutTimelineEntrySchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

/**
 * GET /api/v1/about-timeline
 * Retrieve all timeline entries
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getTimeline(), 10000, "Get timeline entries");

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutTimeline] Retrieved ${result.value.length} entries`);
  return res.json(result.value);
});

/**
 * GET /api/v1/about-timeline/:id
 * Retrieve single timeline entry
 */
router.get("/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Timeline Entry");
  if (id === null) return;

  const result = await withTimeout(aboutService.getTimelineEntry(id), 10000, "Get timeline entry");

  if (result.isErr()) {
    throw result.error;
  }

  const entry = result.value;
  if (!entry) {
    throw new ValidationError(`Timeline entry ${id} not found`);
  }

  logger.info(`[AboutTimeline] Retrieved entry ${id}`);
  return res.json(entry);
});

/**
 * POST /api/v1/about-timeline
 * Create new timeline entry
 */
router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutTimelineEntrySchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid timeline entry data", { issues: validation.error.issues });
  }

  const result = await withTimeout(
    aboutService.createTimelineEntry(removeUndefined(validation.data)),
    10000,
    "Create timeline entry",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutTimeline] Created entry ${result.value.id}`);
  return res.status(201).json(result.value);
});

/**
 * PATCH /api/v1/about-timeline/:id
 * Update timeline entry
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Timeline Entry");
  if (id === null) return;

  const validation = insertAboutTimelineEntrySchema.partial().safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid timeline update data", { issues: validation.error.issues });
  }

  const result = await withTimeout(
    aboutService.updateTimelineEntry(id, removeUndefined(validation.data)),
    10000,
    "Update timeline entry",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutTimeline] Updated entry ${id}`);
  return res.json(result.value);
});

/**
 * DELETE /api/v1/about-timeline/:id
 * Delete timeline entry
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Timeline Entry");
  if (id === null) return;

  const result = await withTimeout(
    aboutService.deleteTimelineEntry(id),
    10000,
    "Delete timeline entry",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutTimeline] Deleted entry ${id}`);
  return res.status(204).send();
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
 * PATCH /api/v1/about-timeline/reorder
 * Reorder timeline entries
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid reorder data", { issues: validation.error.issues });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

  const result = await withTimeout(
    aboutService.reorderTimelineEntries(orderedIds),
    15000,
    "Reorder timeline entries",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutTimeline] Reordered ${orderedIds.length} entries`);
  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
