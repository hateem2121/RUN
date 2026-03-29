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
      position: z.number().int().min(0),
    }),
  ),
});

/**
 * GET /api/v1/about-sections
 * Retrieve all sections
 */
router.get("/", async (_req, res) => {
  const sections = await withTimeout(aboutService.getSections(), 10000, "Get about sections");

  logger.info(`[AboutSections] Retrieved ${sections.length} sections`);
  return res.json(sections);
});

/**
 * GET /api/v1/about-sections/:id
 * Retrieve single section
 */
router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const section = await withTimeout(aboutService.getSection(id), 10000, "Get about section");

  if (!section) {
    return res.status(404).json({ error: "Section not found" });
  }

  logger.info(`[AboutSections] Retrieved section ${id}`);
  return res.json(section);
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

  const newSection = await withTimeout(
    aboutService.createSection(removeUndefined(validation.data)),
    10000,
    "Create about section",
  );

  if (!newSection) {
    throw new Error("Failed to create section");
  }

  // Invalidation handled by service layer
  logger.info(`[AboutSections] Created section ${newSection.id}`);
  return res.status(201).json(newSection);
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

  const updatedSection = await withTimeout(
    aboutService.updateSection(id, removeUndefined(validation.data)),
    10000,
    "Update about section",
  );

  if (!updatedSection) {
    return res.status(404).json({ error: "Section not found" });
  }

  // Invalidation handled by service layer
  logger.info(`[AboutSections] Updated section ${id}`);
  return res.json(updatedSection);
});

/**
 * DELETE /api/v1/about-sections/:id
 * Delete section
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(aboutService.deleteSection(id), 10000, "Delete about section");

  if (!deleted) {
    return res.status(404).json({ error: "Section not found" });
  }

  // Invalidation handled by service layer
  logger.info(`[AboutSections] Deleted section ${id}`);
  return res.status(204).send();
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

  // Update positions
  const updates = await Promise.all(
    removeUndefined(validation.data).entries.map(({ id, position }) =>
      aboutService.updateSection(id, { sortOrder: position }),
    ),
  );

  // Invalidation handled by service layer
  logger.info(`[AboutSections] Reordered ${updates.length} sections`);
  return res.json({ success: true, updated: updates.length });
});

export default router;
