import { Router } from "express";
import { CacheKeys } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { sustainabilityService } from "../../services/sustainability.service.js";

/**
 * SUSTAINABILITY BATCH RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Batch management.
 * Refactored to "Thin Controller" pattern: delegates business logic to sustainabilityService.
 */
const router = Router();

// Cache TTL constant (120 minutes)
const CACHE_TTL_BATCH = 7200;

router.get("/", async (req, res) => {
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
