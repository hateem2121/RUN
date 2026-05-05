import { removeUndefined } from "../../lib/utilities/core-utils.js";

/**
 * SUSTAINABILITY METRICS RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Metrics management
 * Handles full CRUD + reorder operations for sustainability metrics
 *
 * Routes:
 * - GET    /api/v1/sustainability-metrics           - List all metrics
 * - GET    /api/v1/sustainability-metrics/:id       - Get single metric
 * - POST   /api/v1/sustainability-metrics           - Create new metric
 * - PATCH  /api/v1/sustainability-metrics/:id       - Update metric
 * - DELETE /api/v1/sustainability-metrics/:id       - Delete metric
 * - PATCH  /api/v1/sustainability-metrics/reorder   - Reorder metrics
 */

import { type Request, Router } from "express";
import { z } from "zod";
import { insertSustainabilityMetricSchema } from "../../../shared/index.js";
import { CacheKeys, CacheOperations } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { sustainabilityRepository } from "../../lib/db/repositories/index.js";
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
  metrics: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (req, res) => {
  // CHUNK 7: Check cache first (unless admin bypass)
  const cacheKey = CacheKeys.sustainability.metrics();
  const cached = await unifiedCache.get(cacheKey);

  if (cached && !shouldBypassCache(req)) {
    logger.info("[SustainabilityMetrics] Cache hit - returning cached metrics");
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }

  // Cache miss or admin bypass - fetch from database
  if (shouldBypassCache(req)) {
    logger.info("[SustainabilityMetrics] Admin/debug request - bypassing cache");
  } else {
    logger.info("[SustainabilityMetrics] Cache miss - fetching from database");
  }
  const metrics = await withTimeout(
    sustainabilityRepository.getSustainabilityMetrics(),
    10000,
    "Get sustainability metrics",
  );

  // Store in cache
  await unifiedCache.set(cacheKey, metrics, CACHE_TTL_STATIC * 1000);
  logger.info(
    `[SustainabilityMetrics] ✅ ${metrics.length} metrics cached for 180 minutes / 3 hours`,
  );

  return res.json(metrics);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const metric = await withTimeout(
    sustainabilityRepository.getSustainabilityMetric(id),
    10000,
    "Get sustainability metric",
  );

  if (!metric) {
    return res.status(404).json({ error: "Metric not found" });
  }

  logger.info(`[SustainabilityMetrics] Retrieved metric ${id}`);
  return res.json(metric);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertSustainabilityMetricSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[SustainabilityMetrics] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const newMetric = await withTimeout(
    sustainabilityRepository.createSustainabilityMetric(removeUndefined(validation.data)),
    10000,
    "Create sustainability metric",
  );

  CacheOperations.invalidateSustainability()
    .then(() => logger.info("[SustainabilityMetrics] ✅ Cache invalidated after creation"))
    .catch((cacheError) =>
      logger.error("[SustainabilityMetrics] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[SustainabilityMetrics] Created metric ${newMetric.id}`);
  return res.status(201).json(newMetric);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertSustainabilityMetricSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[SustainabilityMetrics] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updated = await withTimeout(
    sustainabilityRepository.updateSustainabilityMetric(id, removeUndefined(validation.data)),
    10000,
    "Update sustainability metric",
  );

  if (!updated) {
    return res.status(404).json({ error: "Metric not found" });
  }

  CacheOperations.invalidateSustainability()
    .then(() => logger.info("[SustainabilityMetrics] ✅ Cache invalidated after update"))
    .catch((cacheError) =>
      logger.error("[SustainabilityMetrics] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[SustainabilityMetrics] Updated metric ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    sustainabilityRepository.deleteSustainabilityMetric(id),
    10000,
    "Delete sustainability metric",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Metric not found" });
  }

  CacheOperations.invalidateSustainability()
    .then(() => logger.info("[SustainabilityMetrics] ✅ Cache invalidated after deletion"))
    .catch((cacheError) =>
      logger.error("[SustainabilityMetrics] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info(`[SustainabilityMetrics] Deleted metric ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[SustainabilityMetrics] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const orderedIds = removeUndefined(validation.data).metrics.map((m: { id: number }) => m.id);
  await withTimeout(
    sustainabilityRepository.reorderSustainabilityMetrics(orderedIds),
    10000,
    "Reorder sustainability metrics",
  );

  // Cache invalidation is handled internally by reorderSustainabilityMetrics repo method

  logger.info(
    `[SustainabilityMetrics] Reordered ${removeUndefined(validation.data).metrics.length} metrics`,
  );
  return res.json({ success: true, count: removeUndefined(validation.data).metrics.length });
});

/**
 * PHASE 4: Cache warming now handled by CacheWarmupRegistry
 * Old HTTP-based warming removed to eliminate duplicate DB queries
 * See: server/lib/cache-warmup-registry.ts -> sustainabilityMetrics
 */

export default router;
