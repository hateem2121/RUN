import { insertFiberSchema } from "@run-remix/shared";
import { Router } from "express";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { retryDbOperation } from "../../lib/db/db-retry.js";
import { miscRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";

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
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
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
  await CacheOperations.invalidateFibers().catch((err) =>
    logger.warn("Failed to invalidate fibers cache", err),
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
  await CacheOperations.invalidateFibers().catch((err) =>
    logger.warn("Failed to invalidate fibers cache", err),
  );
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
  await CacheOperations.invalidateFibers().catch((err) =>
    logger.warn("Failed to invalidate fibers cache", err),
  );
  return res.status(204).send();
});

export default router;
