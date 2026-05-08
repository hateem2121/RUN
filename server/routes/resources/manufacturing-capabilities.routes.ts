import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { manufacturingService } from "../../services/manufacturing.service.js";
import {
  validateManufacturingCapability,
  validateManufacturingCapabilityPartial,
  validateReorderCapabilities,
} from "../../validation/manufacturing.js";

/**
 * MANUFACTURING CAPABILITIES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Capabilities management.
 * Refactored to "Thin Controller" pattern: delegates business logic to manufacturingService.
 */
const router = Router();

router.get("/", async (_req, res) => {
  const result = await manufacturingService.getCapabilities();
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await manufacturingService.getCapability(id);
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingCapability(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.createCapability(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = validateManufacturingCapabilityPartial(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.updateCapability(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await manufacturingService.deleteCapability(id);
  if (result.isErr()) throw result.error;

  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = validateReorderCapabilities(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const orderedIds = validation.data.capabilities
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await manufacturingService.reorderCapabilities(orderedIds);
  if (result.isErr()) throw result.error;

  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
