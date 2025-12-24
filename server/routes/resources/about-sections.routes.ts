/**
 * ABOUT SECTIONS RESOURCE ROUTER
 *
 * Modular Express Router for About Sections management
 * Handles full CRUD + reorder operations for about page sections
 *
 * Routes:
 * - GET    /api/v1/about-sections           - List all sections
 * - GET    /api/v1/about-sections/:id       - Get single section
 * - POST   /api/v1/about-sections           - Create new section
 * - PATCH  /api/v1/about-sections/:id       - Update section
 * - DELETE /api/v1/about-sections/:id       - Delete section
 * - PATCH  /api/v1/about-sections/reorder   - Reorder sections
 */

import { Router } from "express";
import { z } from "zod";
import { insertAboutSectionSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
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
 * GET /api/v1/about-sections
 * Retrieve all sections
 */
router.get("/", async (_req, res) => {
  try {
    const sections = await withTimeout(aboutService.getSections(), 10000, "Get about sections");

    logger.info(`[AboutSections] Retrieved ${sections.length} sections`);
    return res.json(sections);
  } catch (error) {
    logger.error("[AboutSections] Error getting sections:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get sections",
    });
  }
});

/**
 * GET /api/v1/about-sections/:id
 * Retrieve single section
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const section = await withTimeout(aboutService.getSection(id), 10000, "Get about section");

    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    logger.info(`[AboutSections] Retrieved section ${id}`);
    return res.json(section);
  } catch (error) {
    logger.error("[AboutSections] Error getting section:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get section",
    });
  }
});

/**
 * POST /api/v1/about-sections
 * Create new section
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const validation = insertAboutSectionSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutSections] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const newSection = await withTimeout(
      aboutService.createSection(validation.data),
      10000,
      "Create about section",
    );

    if (!newSection) {
      throw new Error("Failed to create section");
    }

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutSections] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[AboutSections] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutSections] Created section ${newSection.id}`);
    return res.status(201).json(newSection);
  } catch (error) {
    logger.error("[AboutSections] Error creating section:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create section",
    });
  }
});

/**
 * PATCH /api/v1/about-sections/:id
 * Update section
 */
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = insertAboutSectionSchema.partial().safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutSections] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updatedSection = await withTimeout(
      aboutService.updateSection(id, validation.data),
      10000,
      "Update about section",
    );

    if (!updatedSection) {
      return res.status(404).json({ error: "Section not found" });
    }

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutSections] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[AboutSections] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutSections] Updated section ${id}`);
    return res.json(updatedSection);
  } catch (error) {
    logger.error("[AboutSections] Error updating section:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update section",
    });
  }
});

/**
 * DELETE /api/v1/about-sections/:id
 * Delete section
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      aboutService.deleteSection(id),
      10000,
      "Delete about section",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Section not found" });
    }

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutSections] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[AboutSections] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutSections] Deleted section ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[AboutSections] Error deleting section:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete section",
    });
  }
});

/**
 * PATCH /api/v1/about-sections/reorder
 * Reorder sections
 */
router.patch("/reorder", requireAdmin, async (req, res) => {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutSections] Reorder validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Update positions
    const updates = await Promise.all(
      validation.data.entries.map(({ id, position }) =>
        aboutService.updateSection(id, { sortOrder: position }),
      ),
    );

    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutSections] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[AboutSections] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[AboutSections] Reordered ${updates.length} sections`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[AboutSections] Error reordering sections:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder sections",
    });
  }
});

export default router;
