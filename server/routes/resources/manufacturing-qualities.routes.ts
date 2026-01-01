/**
 * MANUFACTURING QUALITIES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Quality Assurance management
 * Handles full CRUD + reorder operations for quality assurance items
 *
 * Routes:
 * - GET    /api/v1/manufacturing-qualities           - List all quality items
 * - GET    /api/v1/manufacturing-qualities/:id       - Get single quality item
 * - POST   /api/v1/manufacturing-qualities           - Create new quality item
 * - PATCH  /api/v1/manufacturing-qualities/:id       - Update quality item
 * - DELETE /api/v1/manufacturing-qualities/:id       - Delete quality item
 * - PATCH  /api/v1/manufacturing-qualities/reorder   - Reorder quality items
 */

import { Router } from "express";
import { z } from "zod";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";
import {
  validateManufacturingQuality,
  validateManufacturingQualityPartial,
  validateReorderQualities,
} from "../../validation/manufacturing.js";

const router = Router();

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

router.get("/", async (_req, res) => {
  try {
    const qualities = await withTimeout(
      getStorage().getManufacturingQualities(),
      10000,
      "Get manufacturing qualities",
    );

    logger.info(`[ManufacturingQualities] Retrieved ${qualities.length} quality items`);
    return res.json(qualities);
  } catch (error) {
    logger.error("[ManufacturingQualities] Error getting quality items:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get quality items",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const quality = await withTimeout(
      getStorage().getManufacturingQuality(id),
      10000,
      "Get manufacturing quality",
    );

    if (!quality) {
      return res.status(404).json({ error: "Quality item not found" });
    }

    logger.info(`[ManufacturingQualities] Retrieved quality item ${id}`);
    return res.json(quality);
  } catch (error) {
    logger.error("[ManufacturingQualities] Error getting quality item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get quality item",
    });
  }
});

router.post("/", authService.requireAdmin, async (req, res) => {
  try {
    const validation = validateManufacturingQuality(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingQualities] Validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const newQuality = await withTimeout(
      getStorage().createManufacturingQuality(validation.data),
      10000,
      "Create manufacturing quality",
    );

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingQualities] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[ManufacturingQualities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingQualities] Created quality item ${newQuality.id}`);
    return res.status(201).json(newQuality);
  } catch (error) {
    logger.error("[ManufacturingQualities] Error creating quality item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create quality item",
    });
  }
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = validateManufacturingQualityPartial(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingQualities] Validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const updated = await withTimeout(
      getStorage().updateManufacturingQuality(id, validation.data),
      10000,
      "Update manufacturing quality",
    );

    if (!updated) {
      return res.status(404).json({ error: "Quality item not found" });
    }

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingQualities] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[ManufacturingQualities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingQualities] Updated quality item ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error("[ManufacturingQualities] Error updating quality item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update quality item",
    });
  }
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      getStorage().deleteManufacturingQuality(id),
      10000,
      "Delete manufacturing quality",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Quality item not found" });
    }

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingQualities] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[ManufacturingQualities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingQualities] Deleted quality item ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[ManufacturingQualities] Error deleting quality item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete quality item",
    });
  }
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  try {
    const validation = validateReorderQualities(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingQualities] Reorder validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const updates = await Promise.all(
      validation.data.qualities.map(({ id, position }: { id: number; position: number }) =>
        getStorage().updateManufacturingQuality(id, { sortOrder: position }),
      ),
    );

    try {
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingQualities] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[ManufacturingQualities] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingQualities] Reordered ${updates.length} quality items`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[ManufacturingQualities] Error reordering quality items:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder quality items",
    });
  }
});

export default router;
