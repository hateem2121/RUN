import { removeUndefined } from "../../utils.js";

/**
 * TECHNOLOGY INNOVATIONS RESOURCE ROUTER
 *
 * Modular Express Router for Technology Innovations management
 * Handles full CRUD + reorder operations for technology innovations
 *
 * Routes:
 * - GET    /api/v1/technology-innovations           - List all innovations
 * - GET    /api/v1/technology-innovations/:id       - Get single innovation
 * - POST   /api/v1/technology-innovations           - Create new innovation
 * - PATCH  /api/v1/technology-innovations/:id       - Update innovation
 * - DELETE /api/v1/technology-innovations/:id       - Delete innovation
 * - PATCH  /api/v1/technology-innovations/reorder   - Reorder innovations
 */

import { type Request, Router } from "express";
import { z } from "zod";
import {
  insertTechnologyInnovationSchema,
  type TechnologyInnovation,
} from "../../../shared/index.js";
import { CacheKeys, CacheOperations } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { technologyRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased from 3600s (60min) to 10800s (180min)
const CACHE_TTL_STATIC = 10800; // 180 minutes (3 hours) - static content changes rarely

/**
 * CHUNK 7: Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

const reorderSchema = z.object({
  innovations: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (req, res) => {
  // CHUNK 7: Check cache first (unless admin bypass)
  const cacheKey = CacheKeys.technology.innovations();
  const cached = await unifiedCache.get<TechnologyInnovation[]>(cacheKey);

  if (cached && !shouldBypassCache(req)) {
    logger.info("[TechnologyInnovations] Cache hit - returning cached innovations");
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }

  // Cache miss or admin bypass - fetch from database
  if (shouldBypassCache(req)) {
    logger.info("[TechnologyInnovations] Admin/debug request - bypassing cache");
  } else {
    logger.info("[TechnologyInnovations] Cache miss - fetching from database");
  }
  const innovations = await withTimeout(
    technologyRepository.getTechnologyInnovations(),
    10000,
    "Get technology innovations",
  );

  // Store in cache
  await unifiedCache.set(cacheKey, innovations, CACHE_TTL_STATIC * 1000);
  logger.info(
    `[TechnologyInnovations] ✅ ${innovations.length} innovations cached for 180 minutes / 3 hours`,
  );

  return res.json(innovations);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const innovation = await withTimeout(
    technologyRepository.getTechnologyInnovation(id),
    10000,
    "Get technology innovation",
  );

  if (!innovation) {
    return res.status(404).json({ error: "Innovation not found" });
  }

  logger.info(`[TechnologyInnovations] Retrieved innovation ${id}`);
  return res.json(innovation);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyInnovationSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyInnovations] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const newInnovation = await withTimeout(
    technologyRepository.createTechnologyInnovation(removeUndefined(validation.data)),
    10000,
    "Create technology innovation",
  );

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyInnovations] ✅ Cache invalidated after creation"))
    .catch((cacheError) =>
      logger.error("[TechnologyInnovations] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyInnovations] Created innovation ${newInnovation.id}`);
  return res.status(201).json(newInnovation);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertTechnologyInnovationSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyInnovations] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updated = await withTimeout(
    technologyRepository.updateTechnologyInnovation(id, removeUndefined(validation.data)),
    10000,
    "Update technology innovation",
  );

  if (!updated) {
    return res.status(404).json({ error: "Innovation not found" });
  }

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyInnovations] ✅ Cache invalidated after update"))
    .catch((cacheError) =>
      logger.error("[TechnologyInnovations] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyInnovations] Updated innovation ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    technologyRepository.deleteTechnologyInnovation(id),
    10000,
    "Delete technology innovation",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Innovation not found" });
  }

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyInnovations] ✅ Cache invalidated after deletion"))
    .catch((cacheError) =>
      logger.error("[TechnologyInnovations] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyInnovations] Deleted innovation ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyInnovations] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updates = await Promise.all(
    removeUndefined(validation.data).innovations.map(({ id, position }) =>
      technologyRepository.updateTechnologyInnovation(id, { sortOrder: position }),
    ),
  );

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyInnovations] ✅ Cache invalidated after reorder"))
    .catch((cacheError) =>
      logger.error("[TechnologyInnovations] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[TechnologyInnovations] Reordered ${updates.length} innovations`);
  return res.json({ success: true, updated: updates.length });
});

/**
 * PHASE 4: Cache warming now handled by CacheWarmupRegistry
 * Old HTTP-based warming removed to eliminate duplicate DB queries
 * See: server/lib/cache-warmup-registry.ts -> technologyInnovations
 */

export default router;
