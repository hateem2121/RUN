import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { manufacturingService } from "../../services/manufacturing.service.js";
import {
  validateManufacturingProcess,
  validateManufacturingProcessPartial,
  validateReorderProcesses,
} from "../../validation/manufacturing.js";

/**
 * MANUFACTURING PROCESSES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Processes management.
 * Refactored to "Thin Controller" pattern: delegates business logic to manufacturingService.
 * Enforces RFC 9110/9457 compliance via native Express 5 error propagation.
 */
const router = Router();

router.get("/", async (req, res) => {
  const result = await manufacturingService.getProcesses(shouldBypassCache(req));

  if (result.isErr()) throw result.error;

  const processes = result.value;

  return res.json(
    processes.map((p) => ({
      ...p,
      title: p.title || p.name || "Untitled Process",
    })),
  );
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await manufacturingService.getProcess(id);

  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingProcess(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.createProcess(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = validateManufacturingProcessPartial(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.updateProcess(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await manufacturingService.deleteProcess(id);

  if (result.isErr()) throw result.error;

  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = validateReorderProcesses(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const orderedIds = validation.data.processes
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await manufacturingService.reorderProcesses(orderedIds);
  if (result.isErr()) throw result.error;

  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
