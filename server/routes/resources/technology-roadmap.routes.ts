import { removeUndefined } from "../../lib/utilities/core-utils.js";

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
import { insertTechnologyRoadmapSchema } from "../../../shared/index.js";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { technologyRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
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
  const roadmap = await withTimeout(
    technologyRepository.getTechnologyRoadmap(),
    10000,
    "Get technology roadmap",
  );

  logger.info(`[TechnologyRoadmap] Retrieved ${roadmap.length} roadmap items`);
  return res.json(roadmap);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const item = await withTimeout(
    technologyRepository.getTechnologyRoadmapItem(id),
    10000,
    "Get technology roadmap item",
  );

  if (!item) {
    return res.status(404).json({ error: "Roadmap item not found" });
  }

  logger.info(`[TechnologyRoadmap] Retrieved roadmap item ${id}`);
  return res.json(item);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyRoadmapSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyRoadmap] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const newItem = await withTimeout(
    technologyRepository.createTechnologyRoadmap(removeUndefined(validation.data)),
    10000,
    "Create technology roadmap item",
  );

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyRoadmap] ✅ Cache invalidated after creation"))
    .catch((cacheError) =>
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyRoadmap] Created roadmap item ${newItem.id}`);
  return res.status(201).json(newItem);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
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
    technologyRepository.updateTechnologyRoadmap(id, removeUndefined(validation.data)),
    10000,
    "Update technology roadmap item",
  );

  if (!updated) {
    return res.status(404).json({ error: "Roadmap item not found" });
  }

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyRoadmap] ✅ Cache invalidated after update"))
    .catch((cacheError) =>
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyRoadmap] Updated roadmap item ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    technologyRepository.deleteTechnologyRoadmap(id),
    10000,
    "Delete technology roadmap item",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Roadmap item not found" });
  }

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyRoadmap] ✅ Cache invalidated after deletion"))
    .catch((cacheError) =>
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyRoadmap] Deleted roadmap item ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyRoadmap] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updates = await Promise.all(
    removeUndefined(validation.data).roadmap.map(({ id, position }) =>
      technologyRepository.updateTechnologyRoadmap(id, { sortOrder: position }),
    ),
  );

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyRoadmap] ✅ Cache invalidated after reorder"))
    .catch((cacheError) =>
      logger.error("[TechnologyRoadmap] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyRoadmap] Reordered ${updates.length} roadmap items`);
  return res.json({ success: true, updated: updates.length });
});

export default router;
