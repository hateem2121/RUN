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
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
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
  try {
    const capabilities = await withTimeout(
      getStorage().getManufacturingCapabilities(),
      10000,
      "Get manufacturing capabilities",
    );

    logger.info(`[ManufacturingCapabilities] Retrieved ${capabilities.length} capabilities`);
    return res.json(capabilities);
  } catch (error) {
    logger.error("[ManufacturingCapabilities] Error getting capabilities:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get capabilities",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const capability = await withTimeout(
      getStorage().getManufacturingCapability(id),
      10000,
      "Get manufacturing capability",
    );

    if (!capability) {
      return res.status(404).json({ error: "Capability not found" });
    }

    logger.info(`[ManufacturingCapabilities] Retrieved capability ${id}`);
    return res.json(capability);
  } catch (error) {
    logger.error("[ManufacturingCapabilities] Error getting capability:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get capability",
    });
  }
});

router.post("/", authService.requireAdmin, async (req, res) => {
  try {
    const validation = validateManufacturingCapability(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingCapabilities] Validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const newCapability = await withTimeout(
      getStorage().createManufacturingCapability(validation.data as any),
      10000,
      "Create manufacturing capability",
    );

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingCapabilities] Created capability ${newCapability.id}`);
    return res.status(201).json(newCapability);
  } catch (error) {
    logger.error("[ManufacturingCapabilities] Error creating capability:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create capability",
    });
  }
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = validateManufacturingCapabilityPartial(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingCapabilities] Validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const updated = await withTimeout(
      getStorage().updateManufacturingCapability(id, validation.data),
      10000,
      "Update manufacturing capability",
    );

    if (!updated) {
      return res.status(404).json({ error: "Capability not found" });
    }

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingCapabilities] Updated capability ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error("[ManufacturingCapabilities] Error updating capability:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update capability",
    });
  }
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      getStorage().deleteManufacturingCapability(id),
      10000,
      "Delete manufacturing capability",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Capability not found" });
    }

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingCapabilities] Deleted capability ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[ManufacturingCapabilities] Error deleting capability:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete capability",
    });
  }
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  try {
    const validation = validateReorderCapabilities(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingCapabilities] Reorder validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const updates = await Promise.all(
      validation.data.capabilities.map(({ id, position }: { id: number; position: number }) =>
        getStorage().updateManufacturingCapability(id, {
          sortOrder: position,
        }),
      ),
    );

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingCapabilities] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[ManufacturingCapabilities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingCapabilities] Reordered ${updates.length} capabilities`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[ManufacturingCapabilities] Error reordering capabilities:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder capabilities",
    });
  }
});

export default router;
