/**
 * TECHNOLOGY ROADMAP RESOURCE ROUTER
 *
 * Modular Express Router for Technology Roadmap management
 * Handles full CRUD + reorder operations for roadmap items
 *
 * Routes:
 * - GET    /api/v1/technology-roadmap           - List all roadmap items
 * - GET    /api/v1/technology-roadmap/:id       - Get single roadmap item
 * - POST   /api/v1/technology-roadmap           - Create new roadmap item
 * - PATCH  /api/v1/technology-roadmap/:id       - Update roadmap item
 * - DELETE /api/v1/technology-roadmap/:id       - Delete roadmap item
 * - PATCH  /api/v1/technology-roadmap/reorder   - Reorder roadmap items
 */

import { Router } from "express";
import { z } from "zod";
import { insertTechnologyRoadmapSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

const reorderSchema = z.object({
  roadmap: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (_req, res) => {
  try {
    const roadmap = await withTimeout(
      getStorage().getTechnologyRoadmap(),
      10000,
      "Get technology roadmap",
    );

    logger.info(`[TechnologyRoadmap] Retrieved ${roadmap.length} roadmap items`);
    return res.json(roadmap);
  } catch (error) {
    logger.error("[TechnologyRoadmap] Error getting roadmap:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get roadmap items",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const item = await withTimeout(
      getStorage().getTechnologyRoadmapItem(id),
      10000,
      "Get technology roadmap item",
    );

    if (!item) {
      return res.status(404).json({ error: "Roadmap item not found" });
    }

    logger.info(`[TechnologyRoadmap] Retrieved roadmap item ${id}`);
    return res.json(item);
  } catch (error) {
    logger.error("[TechnologyRoadmap] Error getting roadmap item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get roadmap item",
    });
  }
});

router.post("/", authService.requireAdmin, async (req, res) => {
  try {
    const validation = insertTechnologyRoadmapSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[TechnologyRoadmap] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const newItem = await withTimeout(
      getStorage().createTechnologyRoadmap(validation.data),
      10000,
      "Create technology roadmap item",
    );

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyRoadmap] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyRoadmap] Created roadmap item ${newItem.id}`);
    return res.status(201).json(newItem);
  } catch (error) {
    logger.error("[TechnologyRoadmap] Error creating roadmap item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create roadmap item",
    });
  }
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = insertTechnologyRoadmapSchema.partial().safeParse(req.body);

    if (!validation.success) {
      logger.warn("[TechnologyRoadmap] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updated = await withTimeout(
      getStorage().updateTechnologyRoadmap(id, validation.data),
      10000,
      "Update technology roadmap item",
    );

    if (!updated) {
      return res.status(404).json({ error: "Roadmap item not found" });
    }

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyRoadmap] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyRoadmap] Updated roadmap item ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error("[TechnologyRoadmap] Error updating roadmap item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update roadmap item",
    });
  }
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      getStorage().deleteTechnologyRoadmap(id),
      10000,
      "Delete technology roadmap item",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Roadmap item not found" });
    }

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyRoadmap] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyRoadmap] Deleted roadmap item ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[TechnologyRoadmap] Error deleting roadmap item:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete roadmap item",
    });
  }
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[TechnologyRoadmap] Reorder validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updates = await Promise.all(
      validation.data.roadmap.map(({ id, position }) =>
        getStorage().updateTechnologyRoadmap(id, { sortOrder: position }),
      ),
    );

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyRoadmap] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[TechnologyRoadmap] Reordered ${updates.length} roadmap items`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[TechnologyRoadmap] Error reordering roadmap items:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder roadmap items",
    });
  }
});

export default router;
