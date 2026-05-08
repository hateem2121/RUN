import { Router } from "express";
import { CacheKeys } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { aboutService } from "../../services/about.service.js";
import { sustainabilityService } from "../../services/sustainability.service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * PAGE CONTENT RESOURCE ROUTER
 *
 * Modular Express Router for Page Content Batch management.
 * Refactored to "Thin Controller" pattern: delegates business logic to specialized services.
 */
const router = Router();

// Cache TTL constants (in seconds)
const CACHE_TTL_BATCH = 7200; // 120 minutes

// ============================================================================
// BATCH ROUTES
// ============================================================================

router.get("/about-batch", async (req, res) => {
  const startTime = performance.now();
  const cacheKey = CacheKeys.about.batch();

  if (!shouldBypassCache(req)) {
    const cached = await unifiedCache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache-Hit", "true");
      res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
      return res.json(cached);
    }
  }

  const result = await aboutService.getBatch();
  if (result.isErr()) throw result.error;

  const batchData = result.value;
  await unifiedCache.set(cacheKey, batchData, CACHE_TTL_BATCH);

  res.setHeader("X-Cache-Hit", "false");
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  return res.json(batchData);
});

router.get("/technology-batch", async (req, res) => {
  const startTime = performance.now();
  const cacheKey = CacheKeys.technology.batch();

  if (!shouldBypassCache(req)) {
    const cached = await unifiedCache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache-Hit", "true");
      res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
      return res.json(cached);
    }
  }

  const result = await technologyService.getBatch();
  if (result.isErr()) throw result.error;

  const batchData = result.value;
  await unifiedCache.set(cacheKey, batchData, CACHE_TTL_BATCH);

  res.setHeader("X-Cache-Hit", "false");
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  return res.json(batchData);
});

router.get("/sustainability-batch", async (req, res) => {
  const startTime = performance.now();
  const cacheKey = CacheKeys.sustainability.batch();

  if (!shouldBypassCache(req)) {
    const cached = await unifiedCache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache-Hit", "true");
      res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
      return res.json(cached);
    }
  }

  const result = await sustainabilityService.getBatch();
  if (result.isErr()) throw result.error;

  const batchData = result.value;
  await unifiedCache.set(cacheKey, batchData, CACHE_TTL_BATCH);

  res.setHeader("X-Cache-Hit", "false");
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  return res.json(batchData);
});

export default router;
