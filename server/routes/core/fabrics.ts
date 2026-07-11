/**
 * FABRICS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all fabric CRUD operations and relationships
 */

import { type fabrics, insertFabricSchema } from "@run-remix/shared";
import { Router } from "express";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { retryDbOperation } from "../../lib/db/db-retry.js";
import { miscRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";

type InsertFabric = typeof fabrics.$inferInsert;

const router = Router();

// GET /api/fabrics - List all fabrics
router.get("/fabrics", async (_req, res) => {
  const fabrics = await withTimeout(
    retryDbOperation(() => miscRepository.getFabrics(), {
      operationName: "Get all fabrics",
    }),
    10000,
    "Get all fabrics",
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json(fabrics);
});

// POST /api/fabrics - Create new fabric
router.post("/fabrics", authService.requireAdmin, async (req, res) => {
  const validatedData = insertFabricSchema.parse(req.body);
  const fabric = await withTimeout(
    retryDbOperation(() => miscRepository.createFabric(validatedData as unknown as InsertFabric), {
      operationName: "Create fabric",
    }),
    10000,
    "Create fabric",
  );
  await CacheOperations.invalidateFabrics().catch((err) =>
    logger.warn("Failed to invalidate fabrics cache", err),
  );
  return res.status(201).json(fabric);
});

// PUT /api/fabrics/:id - Update fabric
router.put("/fabrics/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fabric");
  if (id === null) {
    return;
  }
  const validatedData = insertFabricSchema.parse(req.body);
  const fabric = await withTimeout(
    retryDbOperation(
      () => miscRepository.updateFabric(id, validatedData as unknown as Partial<InsertFabric>),
      {
        operationName: `Update fabric ${id}`,
      },
    ),
    10000,
    "Update fabric",
  );

  if (!fabric) {
    return res.status(404).json({
      success: false,
      error: { message: "Fabric not found" },
    });
  }

  await CacheOperations.invalidateFabrics().catch((err) =>
    logger.warn("Failed to invalidate fabrics cache", err),
  );
  return res.json(fabric);
});

// PATCH /api/fabrics/:id - Partial update fabric
router.patch("/fabrics/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fabric");
  if (id === null) {
    return;
  }
  const partialData = insertFabricSchema.partial().parse(req.body);
  const fabric = await withTimeout(
    retryDbOperation(
      () => miscRepository.updateFabric(id, partialData as unknown as Partial<InsertFabric>),
      {
        operationName: `Partial update fabric ${id}`,
      },
    ),
    10000,
    "Partial update fabric",
  );

  if (!fabric) {
    return res.status(404).json({
      success: false,
      error: { message: "Fabric not found" },
    });
  }

  await CacheOperations.invalidateFabrics().catch((err) =>
    logger.warn("Failed to invalidate fabrics cache", err),
  );
  return res.json(fabric);
});

// DELETE /api/fabrics/:id - Delete fabric
router.delete("/fabrics/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fabric");
  if (id === null) {
    return;
  }
  const success = await withTimeout(
    retryDbOperation(() => miscRepository.deleteFabric(id), {
      operationName: `Delete fabric ${id}`,
    }),
    10000,
    "Delete fabric",
  );

  if (!success) {
    return res.status(404).json({
      success: false,
      error: { message: "Fabric not found" },
    });
  }

  await CacheOperations.invalidateFabrics().catch((err) =>
    logger.warn("Failed to invalidate fabrics cache", err),
  );
  return res.status(204).send();
});

export default router;
