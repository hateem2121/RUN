import { removeUndefined } from "../../utils.js";

/**
 * TECHNOLOGY EQUIPMENT RESOURCE ROUTER
 *
 * Modular Express Router for Technology Equipment management
 * Handles full CRUD + reorder operations for technology equipment
 *
 * Routes:
 * - GET    /api/v1/technology-equipment           - List all equipment
 * - GET    /api/v1/technology-equipment/:id       - Get single equipment
 * - POST   /api/v1/technology-equipment           - Create new equipment
 * - PATCH  /api/v1/technology-equipment/:id       - Update equipment
 * - DELETE /api/v1/technology-equipment/:id       - Delete equipment
 * - PATCH  /api/v1/technology-equipment/reorder   - Reorder equipment
 */

import { Router } from "express";
import { z } from "zod";
import { insertTechnologyEquipmentSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

const reorderSchema = z.object({
  equipment: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (_req, res) => {
  try {
    const equipment = await withTimeout(
      getStorage().getTechnologyEquipment(),
      10000,
      "Get technology equipment",
    );

    logger.info(`[TechnologyEquipment] Retrieved ${equipment.length} equipment items`);
    return res.json(equipment);
  } catch (error) {
    logger.error("[TechnologyEquipment] Error getting equipment:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get equipment",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const item = await withTimeout(
      getStorage().getTechnologyEquipmentItem(id),
      10000,
      "Get technology equipment item",
    );

    if (!item) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    logger.info(`[TechnologyEquipment] Retrieved equipment ${id}`);
    return res.json(item);
  } catch (error) {
    logger.error("[TechnologyEquipment] Error getting equipment:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get equipment",
    });
  }
});

router.post("/", authService.requireAdmin, async (req, res) => {
  try {
    const validation = insertTechnologyEquipmentSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[TechnologyEquipment] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const newEquipment = await withTimeout(
      getStorage().createTechnologyEquipment(removeUndefined(validation.data)),
      10000,
      "Create technology equipment",
    );

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyEquipment] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[TechnologyEquipment] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyEquipment] Created equipment ${newEquipment.id}`);
    return res.status(201).json(newEquipment);
  } catch (error) {
    logger.error("[TechnologyEquipment] Error creating equipment:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create equipment",
    });
  }
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = insertTechnologyEquipmentSchema.partial().safeParse(req.body);

    if (!validation.success) {
      logger.warn("[TechnologyEquipment] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updated = await withTimeout(
      getStorage().updateTechnologyEquipment(id, removeUndefined(validation.data)),
      10000,
      "Update technology equipment",
    );

    if (!updated) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyEquipment] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[TechnologyEquipment] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyEquipment] Updated equipment ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error("[TechnologyEquipment] Error updating equipment:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update equipment",
    });
  }
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      getStorage().deleteTechnologyEquipment(id),
      10000,
      "Delete technology equipment",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyEquipment] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[TechnologyEquipment] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyEquipment] Deleted equipment ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[TechnologyEquipment] Error deleting equipment:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete equipment",
    });
  }
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[TechnologyEquipment] Reorder validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updates = await Promise.all(
      removeUndefined(validation.data).equipment.map(({ id, position }) =>
        getStorage().updateTechnologyEquipment(id, { sortOrder: position }),
      ),
    );

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyEquipment] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[TechnologyEquipment] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyEquipment] Reordered ${updates.length} equipment items`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[TechnologyEquipment] Error reordering equipment:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder equipment",
    });
  }
});

export default router;
