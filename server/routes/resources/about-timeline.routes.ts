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
import { logger } from "../../lib/smart-logger.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { insertAboutTimelineEntrySchema } from "../../../shared/schema.js";
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
 * GET /api/v1/about-timeline
 * Retrieve all timeline entries
 */
router.get("/", async (_req, res) => {
  try {
    const entries = await withTimeout(aboutService.getTimeline(), 10000, "Get timeline entries");

    logger.info(`[AboutTimeline] Retrieved ${entries.length} entries`);
    return res.json(entries);
  } catch (error) {
    logger.error("[AboutTimeline] Error getting entries:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get timeline entries",
    });
  }
});

/**
 * GET /api/v1/about-timeline/:id
 * Retrieve single timeline entry
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const entry = await withTimeout(aboutService.getTimelineEntry(id), 10000, "Get timeline entry");

    if (!entry) {
      return res.status(404).json({ error: "Timeline entry not found" });
    }

    logger.info(`[AboutTimeline] Retrieved entry ${id}`);
    return res.json(entry);
  } catch (error) {
    logger.error("[AboutTimeline] Error getting entry:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get timeline entry",
    });
  }
});

/**
 * POST /api/v1/about-timeline
 * Create new timeline entry
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const validation = insertAboutTimelineEntrySchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutTimeline] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const newEntry = await withTimeout(
      aboutService.createTimelineEntry(validation.data),
      10000,
      "Create timeline entry",
    );

    if (!newEntry) {
      throw new Error("Failed to create timeline entry");
    }

    // Invalidate cache
    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutTimeline] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[AboutTimeline] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutTimeline] Created entry ${newEntry.id}`);
    return res.status(201).json(newEntry);
  } catch (error) {
    logger.error("[AboutTimeline] Error creating entry:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create timeline entry",
    });
  }
});

/**
 * PATCH /api/v1/about-timeline/:id
 * Update timeline entry
 */
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = insertAboutTimelineEntrySchema.partial().safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutTimeline] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updatedEntry = await withTimeout(
      aboutService.updateTimelineEntry(id, validation.data),
      10000,
      "Update timeline entry",
    );

    if (!updatedEntry) {
      return res.status(404).json({ error: "Timeline entry not found" });
    }

    // Invalidate cache
    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutTimeline] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[AboutTimeline] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutTimeline] Updated entry ${id}`);
    return res.json(updatedEntry);
  } catch (error) {
    logger.error("[AboutTimeline] Error updating entry:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update timeline entry",
    });
  }
});

/**
 * DELETE /api/v1/about-timeline/:id
 * Delete timeline entry
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      aboutService.deleteTimelineEntry(id),
      10000,
      "Delete timeline entry",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Timeline entry not found" });
    }

    // Invalidate cache
    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutTimeline] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[AboutTimeline] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutTimeline] Deleted entry ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[AboutTimeline] Error deleting entry:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete timeline entry",
    });
  }
});

/**
 * PATCH /api/v1/about-timeline/reorder
 * Reorder timeline entries
 */
router.patch("/reorder", requireAdmin, async (req, res) => {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutTimeline] Reorder validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Update positions for each entry
    const updates = await Promise.all(
      validation.data.entries.map(({ id, position }) =>
        aboutService.updateTimelineEntry(id, { sortOrder: position }),
      ),
    );

    // Invalidate cache
    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutTimeline] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[AboutTimeline] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutTimeline] Reordered ${updates.length} entries`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[AboutTimeline] Error reordering entries:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder timeline entries",
    });
  }
});

export default router;
