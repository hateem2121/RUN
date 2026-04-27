import type { InsertManufacturingCapability } from "@run-remix/shared";
import { removeUndefined } from "../../utils.js";

/**
 * MANUFACTURING CAPABILITIES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Capabilities management
 * Handles full CRUD + reorder operations for manufacturing capabilities
 *
 * Routes:
 * - GET    /api/v1/manufacturing-capabilities           - List all capabilities
 * - GET    /api/v1/manufacturing-capabilities/:id       - Get single capability
 * - POST   /api/v1/manufacturing-capabilities           - Create new capability
 * - PATCH  /api/v1/manufacturing-capabilities/:id       - Update capability
 * - DELETE /api/v1/manufacturing-capabilities/:id       - Delete capability
 * - PATCH  /api/v1/manufacturing-capabilities/reorder   - Reorder capabilities
 */

import { Router } from "express";
import { z } from "zod";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { manufacturingRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import {
  validateManufacturingCapability,
  validateManufacturingCapabilityPartial,
  validateReorderCapabilities,
} from "../../validation/manufacturing.js";

const router = Router();

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

router.get("/", async (_req, res) => {
  const capabilities = await withTimeout(
    manufacturingRepository.getManufacturingCapabilities(),
    10000,
    "Get manufacturing capabilities",
  );

  logger.info(`[ManufacturingCapabilities] Retrieved ${capabilities.length} capabilities`);
  return res.json(capabilities);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const capability = await withTimeout(
    manufacturingRepository.getManufacturingCapability(id),
    10000,
    "Get manufacturing capability",
  );

  if (!capability) {
    return res.status(404).json({ error: "Capability not found" });
  }

  logger.info(`[ManufacturingCapabilities] Retrieved capability ${id}`);
  return res.json(capability);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingCapability(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingCapabilities] Validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const newCapability = await withTimeout(
    manufacturingRepository.createManufacturingCapability(
      removeUndefined(validation.data) as unknown as InsertManufacturingCapability,
    ),
    10000,
    "Create manufacturing capability",
  );

  CacheOperations.invalidateManufacturing()
    .then(() => logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after creation"))
    .catch((cacheError) =>
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[ManufacturingCapabilities] Created capability ${newCapability.id}`);
  return res.status(201).json(newCapability);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = validateManufacturingCapabilityPartial(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingCapabilities] Validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const updated = await withTimeout(
    manufacturingRepository.updateManufacturingCapability(
      id,
      removeUndefined(validation.data) as unknown as Partial<InsertManufacturingCapability>,
    ),
    10000,
    "Update manufacturing capability",
  );

  if (!updated) {
    return res.status(404).json({ error: "Capability not found" });
  }

  CacheOperations.invalidateManufacturing()
    .then(() => logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after update"))
    .catch((cacheError) =>
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[ManufacturingCapabilities] Updated capability ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    manufacturingRepository.deleteManufacturingCapability(id),
    10000,
    "Delete manufacturing capability",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Capability not found" });
  }

  CacheOperations.invalidateManufacturing()
    .then(() => logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after deletion"))
    .catch((cacheError) =>
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[ManufacturingCapabilities] Deleted capability ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = validateReorderCapabilities(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingCapabilities] Reorder validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const updates = await Promise.all(
    removeUndefined(validation.data).capabilities.map(
      ({ id, position }: { id: number; position: number }) =>
        manufacturingRepository.updateManufacturingCapability(id, {
          sortOrder: position,
        }),
    ),
  );

  CacheOperations.invalidateManufacturing()
    .then(() => logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after reorder"))
    .catch((cacheError) =>
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[ManufacturingCapabilities] Reordered ${updates.length} capabilities`);
  return res.json({ success: true, updated: updates.length });
});

export default router;
