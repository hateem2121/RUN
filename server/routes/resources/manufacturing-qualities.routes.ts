/**
 * MANUFACTURING QUALITIES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Quality Assurance management
 * Handles full CRUD + reorder operations for quality assurance items
 *
 * Routes:
 * - GET    /api/v1/manufacturing-qualities           - List all quality items
 * - GET    /api/v1/manufacturing-qualities/:id       - Get single quality item
 * - POST   /api/v1/manufacturing-qualities           - Create new quality item
 * - PATCH  /api/v1/manufacturing-qualities/:id       - Update quality item
 * - DELETE /api/v1/manufacturing-qualities/:id       - Delete quality item
 * - PATCH  /api/v1/manufacturing-qualities/reorder   - Reorder quality items
 */

import { Router } from "express";
import { z } from "zod";
import { manufacturingRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import {
  validateManufacturingQuality,
  validateManufacturingQualityPartial,
  validateReorderQualities,
} from "../../validation/manufacturing.js";

const router = Router();

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

router.get("/", async (_req, res) => {
  const qualities = await withTimeout(
    manufacturingRepository.getManufacturingQualities(),
    10000,
    "Get manufacturing qualities",
  );

  logger.info(`[ManufacturingQualities] Retrieved ${qualities.length} quality items`);
  return res.json(qualities);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const quality = await withTimeout(
    manufacturingRepository.getManufacturingQuality(id),
    10000,
    "Get manufacturing quality",
  );

  if (!quality) {
    return res.status(404).json({ error: "Quality item not found" });
  }

  logger.info(`[ManufacturingQualities] Retrieved quality item ${id}`);
  return res.json(quality);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingQuality(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingQualities] Validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const newQuality = await withTimeout(
    manufacturingRepository.createManufacturingQuality(validation.data),
    10000,
    "Create manufacturing quality",
  );

  logger.info(`[ManufacturingQualities] Created quality item ${newQuality.id}`);
  return res.status(201).json(newQuality);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = validateManufacturingQualityPartial(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingQualities] Validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const updated = await withTimeout(
    manufacturingRepository.updateManufacturingQuality(id, validation.data),
    10000,
    "Update manufacturing quality",
  );

  if (!updated) {
    return res.status(404).json({ error: "Quality item not found" });
  }

  logger.info(`[ManufacturingQualities] Updated quality item ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    manufacturingRepository.deleteManufacturingQuality(id),
    10000,
    "Delete manufacturing quality",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Quality item not found" });
  }

  logger.info(`[ManufacturingQualities] Deleted quality item ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = validateReorderQualities(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingQualities] Reorder validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const { qualities } = validation.data;
  const orderedIds = qualities.sort((a, b) => a.position - b.position).map((item) => item.id);

  await withTimeout(
    manufacturingRepository.reorderManufacturingQualities(orderedIds),
    10000,
    "Reorder manufacturing qualities",
  );

  logger.info(`[ManufacturingQualities] Reordered ${orderedIds.length} quality items`);
  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
