import { removeUndefined } from "../../utils.js";

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
import { insertAboutSectionSchema } from "../../../shared/index.js";
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
 * GET /api/v1/about-sections
 * Retrieve all sections
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getSections(), 10000, "Get about sections");

  return result.match(
    (sections) => {
      logger.info(`[AboutSections] Retrieved ${sections.length} sections`);
      return res.json(sections);
    },
    (error) => {
      logger.error("[AboutSections] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * GET /api/v1/about-sections/:id
 * Retrieve single section
 */
router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTimeout(aboutService.getSection(id), 10000, "Get about section");

  return result.match(
    (section) => {
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      logger.info(`[AboutSections] Retrieved section ${id}`);
      return res.json(section);
    },
    (error) => {
      logger.error("[AboutSections] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * POST /api/v1/about-sections
 * Create new section
 */
router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutSectionSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutSections] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const result = await withTimeout(
    aboutService.createSection(removeUndefined(validation.data)),
    10000,
    "Create about section",
  );

  return result.match(
    (newSection) => {
      logger.info(`[AboutSections] Created section ${newSection.id}`);
      return res.status(201).json(newSection);
    },
    (error) => {
      logger.error("[AboutSections] Create failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-sections/:id
 * Update section
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertAboutSectionSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutSections] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const result = await withTimeout(
    aboutService.updateSection(id, removeUndefined(validation.data)),
    10000,
    "Update about section",
  );

  return result.match(
    (updatedSection) => {
      logger.info(`[AboutSections] Updated section ${id}`);
      return res.json(updatedSection);
    },
    (error) => {
      logger.error("[AboutSections] Update failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * DELETE /api/v1/about-sections/:id
 * Delete section
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTimeout(aboutService.deleteSection(id), 10000, "Delete about section");

  return result.match(
    () => {
      logger.info(`[AboutSections] Deleted section ${id}`);
      return res.status(204).send();
    },
    (error) => {
      logger.error("[AboutSections] Delete failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-sections/reorder
 * Reorder sections
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutSections] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

  const result = await withTimeout(
    aboutService.reorderSections(orderedIds),
    15000,
    "Reorder about sections",
  );

  return result.match(
    () => {
      logger.info(`[AboutSections] Reordered ${orderedIds.length} sections`);
      return res.json({ success: true, updated: orderedIds.length });
    },
    (error) => {
      logger.error("[AboutSections] Reorder failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

export default router;
