import { removeUndefined } from "../../utils.js";

/**
 * SUSTAINABILITY INITIATIVES RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Initiatives management
 * Handles full CRUD + reorder operations for sustainability initiatives
 *
 * Routes:
 * - GET    /api/v1/sustainability-initiatives           - List all initiatives
 * - GET    /api/v1/sustainability-initiatives/:id       - Get single initiative
 * - POST   /api/v1/sustainability-initiatives           - Create new initiative
 * - PATCH  /api/v1/sustainability-initiatives/:id       - Update initiative
 * - DELETE /api/v1/sustainability-initiatives/:id       - Delete initiative
 * - PATCH  /api/v1/sustainability-initiatives/reorder   - Reorder initiatives
 */

import { Router } from "express";
import { z } from "zod";
import { insertSustainabilityInitiativeSchema } from "../../../shared/index.js";
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
  initiatives: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (_req, res) => {
  const initiatives = await withTimeout(
    pageContentRepository.getSustainabilityInitiatives(),
    10000,
    "Get sustainability initiatives",
  );

  logger.info(`[SustainabilityInitiatives] Retrieved ${initiatives.length} initiatives`);
  return res.json(initiatives);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const initiative = await withTimeout(
    pageContentRepository.getSustainabilityInitiative(id),
    10000,
    "Get sustainability initiative",
  );

  if (!initiative) {
    return res.status(404).json({ error: "Initiative not found" });
  }

  logger.info(`[SustainabilityInitiatives] Retrieved initiative ${id}`);
  return res.json(initiative);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertSustainabilityInitiativeSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[SustainabilityInitiatives] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const newInitiative = await withTimeout(
    pageContentRepository.createSustainabilityInitiative(removeUndefined(validation.data)),
    10000,
    "Create sustainability initiative",
  );

  CacheOperations.invalidateSustainability()
    .then(() => logger.info("[SustainabilityInitiatives] ✅ Cache invalidated after creation"))
    .catch((cacheError) =>
      logger.error("[SustainabilityInitiatives] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[SustainabilityInitiatives] Created initiative ${newInitiative.id}`);
  return res.status(201).json(newInitiative);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertSustainabilityInitiativeSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[SustainabilityInitiatives] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updated = await withTimeout(
    pageContentRepository.updateSustainabilityInitiative(id, removeUndefined(validation.data)),
    10000,
    "Update sustainability initiative",
  );

  if (!updated) {
    return res.status(404).json({ error: "Initiative not found" });
  }

  CacheOperations.invalidateSustainability()
    .then(() => logger.info("[SustainabilityInitiatives] ✅ Cache invalidated after update"))
    .catch((cacheError) =>
      logger.error("[SustainabilityInitiatives] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[SustainabilityInitiatives] Updated initiative ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    pageContentRepository.deleteSustainabilityInitiative(id),
    10000,
    "Delete sustainability initiative",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Initiative not found" });
  }

  CacheOperations.invalidateSustainability()
    .then(() => logger.info("[SustainabilityInitiatives] ✅ Cache invalidated after deletion"))
    .catch((cacheError) =>
      logger.error("[SustainabilityInitiatives] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[SustainabilityInitiatives] Deleted initiative ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[SustainabilityInitiatives] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updates = await Promise.all(
    removeUndefined(validation.data).initiatives.map(({ id, position }) =>
      pageContentRepository.updateSustainabilityInitiative(id, {
        sortOrder: position,
      }),
    ),
  );

  CacheOperations.invalidateSustainability()
    .then(() => logger.info("[SustainabilityInitiatives] ✅ Cache invalidated after reorder"))
    .catch((cacheError) =>
      logger.error("[SustainabilityInitiatives] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[SustainabilityInitiatives] Reordered ${updates.length} initiatives`);
  return res.json({ success: true, updated: updates.length });
});

export default router;
