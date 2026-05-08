import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { manufacturingService } from "../../services/manufacturing.service.js";
import {
  validateManufacturingCaseStudy,
  validateManufacturingCaseStudyPartial,
  validateReorderCaseStudies,
} from "../../validation/manufacturing.js";

/**
 * MANUFACTURING CASE STUDIES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Case Studies management.
 * Refactored to "Thin Controller" pattern: delegates business logic to manufacturingService.
 */
const router = Router();

router.get("/", async (req, res) => {
  const result = await manufacturingService.getCaseStudies(shouldBypassCache(req));
  if (result.isErr()) throw result.error;

  const caseStudies = result.value;

  return res.json(caseStudies);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await manufacturingService.getCaseStudy(id);
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingCaseStudy(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.createCaseStudy(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = validateManufacturingCaseStudyPartial(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.updateCaseStudy(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await manufacturingService.deleteCaseStudy(id);
  if (result.isErr()) throw result.error;

  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = validateReorderCaseStudies(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const orderedIds = validation.data.caseStudies
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await manufacturingService.reorderCaseStudies(orderedIds);
  if (result.isErr()) throw result.error;

  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
