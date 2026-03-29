import { removeUndefined } from "../../utils.js";

/**
 * MATERIALS ROUTER MODULE
 * Handles fibers, fabrics, and certificates management
 * Extracted from routes.ts for better organization
 */

import { Router } from "express";
import { insertFiberSchema } from "../../../shared/index.js";
import { retryDbOperation } from "../../lib/db/db-retry.js";
import { miscRepository } from "../../lib/db/repositories/index.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// FIBERS ROUTES
router.get("/fibers", async (_req, res) => {
  const fibers = await withTimeout(
    retryDbOperation(() => miscRepository.getFibers(), {
      operationName: "Get all fibers",
    }),
    10000,
    "Get all fibers",
  );
  res.json(fibers);
});

router.post("/fibers", authService.requireAdmin, async (req, res) => {
  const validatedData = insertFiberSchema.parse(req.body);
  const fiber = await withTimeout(
    retryDbOperation(() => miscRepository.createFiber(removeUndefined(validatedData)), {
      operationName: "Create fiber",
    }),
    10000,
    "Create fiber",
  );
  return res.status(201).json(fiber);
});

router.put("/fibers/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fiber");
  if (id === null) {
    return; // Error response already sent
  }

  const validatedData = insertFiberSchema.partial().parse(req.body);
  const fiber = await withTimeout(
    retryDbOperation(() => miscRepository.updateFiber(id, removeUndefined(validatedData)), {
      operationName: "Update fiber",
    }),
    10000,
    "Update fiber",
  );
  if (!fiber) {
    return res.status(404).json({ message: "Fiber not found" });
  }
  return res.json(fiber);
});

router.delete("/fibers/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fiber");
  if (id === null) {
    return; // Error response already sent
  }

  const deleted = await withTimeout(
    retryDbOperation(() => miscRepository.deleteFiber(id), {
      operationName: "Delete fiber",
    }),
    10000,
    "Delete fiber",
  );
  if (!deleted) {
    return res.status(404).json({ message: "Fiber not found" });
  }
  return res.status(204).send();
});

export default router;
