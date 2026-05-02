import { removeUndefined } from "../../utils.js";

/**
 * ABOUT TIMELINE RESOURCE ROUTER
 *
 * Modular Express Router for About Timeline management
 * Handles full CRUD + reorder operations for timeline entries
 *
 * Routes:
 * - GET    /api/about-timeline           - List all timeline entries
 * - GET    /api/about-timeline/:id       - Get single entry
 * - POST   /api/about-timeline           - Create new entry
 * - PATCH  /api/about-timeline/:id       - Update entry
 * - DELETE /api/about-timeline/:id       - Delete entry
 * - PATCH  /api/about-timeline/reorder   - Reorder entries
 */

import { Router } from "express";
import { z } from "zod";
import { insertAboutTimelineEntrySchema } from "../../../shared/index.js";
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
 * GET /api/v1/about-timeline
 * Retrieve all timeline entries
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getTimeline(), 10000, "Get timeline entries");

  return result.match(
    (entries) => {
      logger.info(`[AboutTimeline] Retrieved ${entries.length} entries`);
      return res.json(entries);
    },
    (error) => {
      logger.error("[AboutTimeline] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * GET /api/v1/about-timeline/:id
 * Retrieve single timeline entry
 */
router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTimeout(aboutService.getTimelineEntry(id), 10000, "Get timeline entry");

  return result.match(
    (entry) => {
      if (!entry) {
        return res.status(404).json({ error: "Timeline entry not found" });
      }
      logger.info(`[AboutTimeline] Retrieved entry ${id}`);
      return res.json(entry);
    },
    (error) => {
      logger.error("[AboutTimeline] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * POST /api/v1/about-timeline
 * Create new timeline entry
 */
router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutTimelineEntrySchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutTimeline] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const result = await withTimeout(
    aboutService.createTimelineEntry(removeUndefined(validation.data)),
    10000,
    "Create timeline entry",
  );

  return result.match(
    (newEntry) => {
      logger.info(`[AboutTimeline] Created entry ${newEntry.id}`);
      return res.status(201).json(newEntry);
    },
    (error) => {
      logger.error("[AboutTimeline] Create failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-timeline/:id
 * Update timeline entry
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertAboutTimelineEntrySchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutTimeline] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const result = await withTimeout(
    aboutService.updateTimelineEntry(id, removeUndefined(validation.data)),
    10000,
    "Update timeline entry",
  );

  return result.match(
    (updatedEntry) => {
      logger.info(`[AboutTimeline] Updated entry ${id}`);
      return res.json(updatedEntry);
    },
    (error) => {
      logger.error("[AboutTimeline] Update failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * DELETE /api/v1/about-timeline/:id
 * Delete timeline entry
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

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
      logger.error("[AboutTimeline] Delete failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-timeline/reorder
 * Reorder timeline entries
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutTimeline] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

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
      logger.error("[AboutTimeline] Reorder failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

export default router;
