import { removeUndefined } from "../../utils.js";

/**
 * TECHNOLOGY RESEARCH RESOURCE ROUTER
 *
 * Modular Express Router for Technology Research & Development management
 * Handles full CRUD + reorder operations for R&D items
 *
 * Routes:
 * - GET    /api/v1/technology-research           - List all research items
 * - GET    /api/v1/technology-research/:id       - Get single research item
 * - POST   /api/v1/technology-research           - Create new research item
 * - PATCH  /api/v1/technology-research/:id       - Update research item
 * - DELETE /api/v1/technology-research/:id       - Delete research item
 * - PATCH  /api/v1/technology-research/reorder   - Reorder research items
 */

import { Router } from "express";
import { z } from "zod";
import { insertTechnologyResearchSchema } from "../../../shared/index.js";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { pageContentRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

const reorderSchema = z.object({
  research: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (_req, res) => {
  const research = await withTimeout(
    pageContentRepository.getTechnologyResearch(),
    10000,
    "Get technology research",
  );

  logger.info(`[TechnologyResearch] Retrieved ${research.length} research items`);
  return res.json(research);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const item = await withTimeout(
    pageContentRepository.getTechnologyResearchItem(id),
    10000,
    "Get technology research item",
  );

  if (!item) {
    return res.status(404).json({ error: "Research item not found" });
  }

  logger.info(`[TechnologyResearch] Retrieved research item ${id}`);
  return res.json(item);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyResearchSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyResearch] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const newResearch = await withTimeout(
    pageContentRepository.createTechnologyResearch(removeUndefined(validation.data)),
    10000,
    "Create technology research",
  );

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyResearch] ✅ Cache invalidated after creation"))
    .catch((cacheError) =>
      logger.error("[TechnologyResearch] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyResearch] Created research item ${newResearch.id}`);
  return res.status(201).json(newResearch);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertTechnologyResearchSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyResearch] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updated = await withTimeout(
    pageContentRepository.updateTechnologyResearch(id, removeUndefined(validation.data)),
    10000,
    "Update technology research",
  );

  if (!updated) {
    return res.status(404).json({ error: "Research item not found" });
  }

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyResearch] ✅ Cache invalidated after update"))
    .catch((cacheError) =>
      logger.error("[TechnologyResearch] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyResearch] Updated research item ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    pageContentRepository.deleteTechnologyResearch(id),
    10000,
    "Delete technology research",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Research item not found" });
  }

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyResearch] ✅ Cache invalidated after deletion"))
    .catch((cacheError) =>
      logger.error("[TechnologyResearch] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyResearch] Deleted research item ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyResearch] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updates = await Promise.all(
    removeUndefined(validation.data).research.map(({ id, position }) =>
      pageContentRepository.updateTechnologyResearch(id, { sortOrder: position }),
    ),
  );

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyResearch] ✅ Cache invalidated after reorder"))
    .catch((cacheError) =>
      logger.error("[TechnologyResearch] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyResearch] Reordered ${updates.length} research items`);
  return res.json({ success: true, updated: updates.length });
});

export default router;
