import type { InsertAboutTimelineEntry } from "@run-remix/shared";
import { insertAboutTimelineEntrySchema, reorderEntriesSchema } from "@run-remix/shared";
import { Router } from "express";
import type { z } from "zod";
import { validateRequest } from "zod-express-middleware";
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
  const result = await withTimeout(
    aboutService.getTimelineEntries(),
    10000,
    "Get timeline entries",
  );

  return result.match(
    (entries) => {
      logger.info(`[AboutTimeline] Retrieved ${entries.length} entries`);
      return res.json(entries);
    },
    (error) => {
      throw error;
    },
  );
});

/**
 * GET /api/v1/about-timeline/:id
 * Retrieve single timeline entry
 */
router.get("/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Timeline Entry");
  if (id === null) return;

  const result = await withTimeout(aboutService.getTimelineEntry(id), 10000, "Get timeline entry");

  return result.match(
    (entry) => {
      if (!entry) {
        throw new ValidationError(`Timeline entry ${id} not found`);
      }
      logger.info(`[AboutTimeline] Retrieved entry ${id}`);
      return res.json(entry);
    },
    (error) => {
      throw error;
    },
  );
});

/**
 * POST /api/v1/about-timeline
 * Create new timeline entry
 */
router.post(
  "/",
  authService.requireAdmin,
  validateRequest({ body: insertAboutTimelineEntrySchema }),
  async (req, res) => {
    const result = await withTimeout(
      aboutService.createTimelineEntry(removeUndefined(req.body as InsertAboutTimelineEntry)),
      10000,
      "Create timeline entry",
    );

    return result.match(
      (entry) => {
        logger.info(`[AboutTimeline] Created entry ${entry.id}`);
        return res.status(201).json(entry);
      },
      (error) => {
        throw error;
      },
    );
  },
);

/**
 * PATCH /api/v1/about-timeline/:id
 * Update timeline entry
 */
router.patch(
  "/:id",
  authService.requireAdmin,
  validateRequest({ body: insertAboutTimelineEntrySchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "Timeline Entry");
    if (id === null) return;

    const result = await withTimeout(
      aboutService.updateTimelineEntry(
        id,
        removeUndefined(req.body as Partial<InsertAboutTimelineEntry>),
      ),
      10000,
      "Update timeline entry",
    );

    return result.match(
      (updatedEntry) => {
        logger.info(`[AboutTimeline] Updated entry ${id}`);
        return res.json(updatedEntry);
      },
      (error) => {
        throw error;
      },
    );
  },
);

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

  return result.match(
    () => {
      logger.info(`[AboutTimeline] Deleted entry ${id}`);
      return res.status(204).send();
    },
    (error) => {
      throw error;
    },
  );
});

/**
 * PATCH /api/v1/about-timeline/reorder
 * Reorder timeline entries
 */
router.patch(
  "/reorder",
  authService.requireAdmin,
  validateRequest({ body: reorderEntriesSchema }),
  async (req, res) => {
    const validatedData = req.body as z.infer<typeof reorderEntriesSchema>;
    // Extract ordered IDs
    const orderedIds = validatedData.entries.map((e) => e.id);

    const result = await withTimeout(
      aboutService.reorderTimelineEntries(orderedIds),
      15000,
      "Reorder timeline entries",
    );

    return result.match(
      () => {
        logger.info(`[AboutTimeline] Reordered ${orderedIds.length} entries`);
        return res.json({ success: true, updated: orderedIds.length });
      },
      (error) => {
        throw error;
      },
    );
  },
);

export default router;
