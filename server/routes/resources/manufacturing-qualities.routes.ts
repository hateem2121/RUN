import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { manufacturingService } from "../../services/manufacturing.service.js";
import {
  validateManufacturingQuality,
  validateManufacturingQualityPartial,
  validateReorderQualities,
} from "../../validation/manufacturing.js";

/**
 * MANUFACTURING QUALITIES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Quality Assurance management.
 * Refactored to "Thin Controller" pattern: delegates business logic to manufacturingService.
 */
const router = Router();

router.get("/", async (_req, res) => {
  const result = await manufacturingService.getQualities();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await manufacturingService.getQuality(id);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingQuality(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.createQuality(removeUndefined(validation.data));
  return result.match(
    (data) => res.status(201).json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const validation = validateManufacturingQualityPartial(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.updateQuality(id, removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await manufacturingService.deleteQuality(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = validateReorderQualities(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const orderedIds = validation.data.qualities
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await manufacturingService.reorderQualities(orderedIds);
  return result.match(
    () => res.json({ success: true, updated: orderedIds.length }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
