import { removeUndefined } from "../../utils.js";

/**
 * MATERIALS ROUTER MODULE
 * Handles fibers, fabrics, and certificates management
 * Extracted from routes.ts for better organization
 */

import { Router } from "express";
import { z } from "zod";
import { insertFiberSchema } from "../../../shared/index.js";
import { retryDbOperation } from "../../lib/db/db-retry.js";
import { miscRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// FIBERS ROUTES
router.get("/fibers", async (_req, res) => {
  try {
    const fibers = await withTimeout(
      retryDbOperation(() => miscRepository.getFibers(), {
        operationName: "Get all fibers",
      }),
      10000,
      "Get all fibers",
    );
    res.json(fibers);
  } catch (error: unknown) {
    logger.error("Route: Error fetching fibers:", error);
    res.status(500).json({
      message: "Failed to fetch fibers",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/fibers", authService.requireAdmin, async (req, res) => {
  try {
    const validatedData = insertFiberSchema.parse(req.body);
    const fiber = await withTimeout(
      retryDbOperation(() => miscRepository.createFiber(removeUndefined(validatedData)), {
        operationName: "Create fiber",
      }),
      10000,
      "Create fiber",
    );
    return res.status(201).json(fiber);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to create fiber" });
  }
});

router.put("/fibers/:id", authService.requireAdmin, async (req, res) => {
  try {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to update fiber" });
  }
});

router.delete("/fibers/:id", authService.requireAdmin, async (req, res) => {
  try {
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
  } catch (error) {
    logger.error("Route: Error deleting fiber:", { error });
    return res.status(500).json({ message: "Failed to delete fiber" });
  }
});

export default router;
