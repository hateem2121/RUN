import { Router } from "express";
import { z } from "zod";
import { insertAboutSectionSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

/**
 * GET /api/v1/about-sections
 * Retrieve all sections
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getSections(), 10000, "Get about sections");

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutSections] Retrieved ${result.value.length} sections`);
  return res.json(result.value);
});

/**
 * GET /api/v1/about-sections/:id
 * Retrieve single section
 */
router.get("/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Section");
  if (id === null) return;

  const result = await withTimeout(aboutService.getSection(id), 10000, "Get about section");

  if (result.isErr()) {
    throw result.error;
  }

  const section = result.value;
  if (!section) {
    throw new ValidationError(`Section ${id} not found`);
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
    throw new ValidationError("Invalid section data", { issues: validation.error.issues });
  }

  const result = await withTimeout(
    aboutService.createSection(removeUndefined(validation.data)),
    10000,
    "Create about section",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutSections] Created section ${result.value.id}`);
  return res.status(201).json(result.value);
});

/**
 * PATCH /api/v1/about-sections/:id
 * Update section
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Section");
  if (id === null) return;

  const validation = insertAboutSectionSchema.partial().safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid section update data", { issues: validation.error.issues });
  }

  const result = await withTimeout(
    aboutService.updateSection(id, removeUndefined(validation.data)),
    10000,
    "Update about section",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutSections] Updated section ${id}`);
  return res.json(result.value);
});

/**
 * DELETE /api/v1/about-sections/:id
 * Delete section
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Section");
  if (id === null) return;

  const result = await withTimeout(aboutService.deleteSection(id), 10000, "Delete about section");

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutSections] Deleted section ${id}`);
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
 * PATCH /api/v1/about-sections/reorder
 * Reorder sections
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid reorder data", { issues: validation.error.issues });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

  const result = await withTimeout(
    aboutService.reorderSections(orderedIds),
    15000,
    "Reorder about sections",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutSections] Reordered ${orderedIds.length} sections`);
  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
