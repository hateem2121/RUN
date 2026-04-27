import { removeUndefined } from "../../utils.js";

/**
 * PHASE 3.2: PAGE CONTENT ROUTES EXTRACTION
 *
 * About, Sustainability, Manufacturing, and Technology Page Routes
 * Extracted from main routes.ts for better organization
 */

import { Router } from "express";
import {
  insertSustainabilityHeroSchema,
  insertTechnologyHeroSchema,
} from "../../../shared/index.js";
import { CacheKeys, CacheOperations } from "../../lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import {
  aboutRepository,
  mediaRepository,
  sustainabilityRepository,
  technologyRepository,
} from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
// Manufacturing imports moved to manufacturing-hero.routes.ts
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { extractMediaIds } from "../../lib/utilities/media-utils.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

interface BatchResponse {
  mediaAssets?: unknown[];
  [key: string]: unknown;
}

// Cache TTL constants (in seconds)
// PHASE 1 OPTIMIZATION: Increased from 900s (15min) to 7200s (120min)
// Navigation and batch data changes infrequently (manual admin updates only)
const CACHE_TTL_NAVIGATION = 7200; // 120 minutes - for batch/navigation data

// Background refresh lock to prevent thundering herd
// Only allow ONE background refresh at a time per cache key
// const activeRefreshes = new Map<string, Promise<void>>();

// ============================================================================
// ABOUT PAGE ROUTES
// ============================================================================

// About batch API - optimized endpoint for all about page data
// Force restart for response-tracker middleware update
router.get("/about-batch", async (_req, res) => {
  const startTime = performance.now();
  // CHUNK 3: Check cache first
  const cacheKey = CacheKeys.about.batch();
  const cached = await unifiedCache.get<BatchResponse>(cacheKey);

  if (cached) {
    logger.info("[About] Returning cached batch data");
    res.setHeader("X-Cache-Hit", "true");
    res.setHeader("X-Response-Time", (performance.now() - startTime).toString());
    res.setHeader("X-Media-Assets-Loaded", (cached.mediaAssets?.length || 0).toString());
    return res.json(cached);
  }

  logger.info("[About] Cache miss - fetching from database");

  // Fetch all about data via optimized repository batch method
  const aboutData = await withTimeout(
    aboutRepository.getAboutBatch(),
    15000,
    "About batch fetch (repository layer)",
  ).catch((err) => {
    logger.error("[About] Aggregate fetch failed, returning empty set", err);
    return {
      hero: null,
      timeline: [],
      locations: [],
      sections: [],
      statistics: [],
      teamMessage: null,
    };
  });

  const { hero, timeline, locations, sections, statistics, teamMessage } = aboutData;

  // Collect all media IDs used in about content
  const dataToScan = [hero, timeline, locations, sections, statistics, teamMessage];
  const mediaIds = extractMediaIds(dataToScan);

  // Fetch only the specific media assets that are actually used
  const mediaAssets =
    mediaIds.size > 0
      ? await withTimeout(
          mediaRepository.getMediaAssetsByIds(Array.from(mediaIds).map((id) => id.toString())),
          10000,
          "Fetch about media assets by IDs",
        )
      : [];

  const batchData = {
    hero,
    timeline,
    locations,
    sections,
    statistics,
    teamMessage,
    mediaAssets: mediaAssets || [],
    _meta: {
      fetchedAt: new Date().toISOString(),
      totalRequests: 1, // Single batch call to repo
      mediaAssetsLoaded: mediaAssets.length,
      mediaIdsRequested: Array.from(mediaIds),
      responseTime: performance.now() - startTime,
    },
  };

  // CHUNK 3: Cache the batch data for 120 minutes (7200s)
  await unifiedCache.set(cacheKey, batchData, CACHE_TTL_NAVIGATION);
  logger.info("[About] Batch data cached for 120 minutes / 2 hours");

  res.setHeader("X-Response-Time", (performance.now() - startTime).toString());
  res.setHeader("X-Media-Assets-Loaded", mediaAssets.length.toString());
  res.setHeader("X-Cache-Hit", "false");
  return res.json(batchData);
});

// ============================================================================
// SUSTAINABILITY PAGE ROUTES
// ============================================================================

// Sustainability hero
router.get("/sustainability-hero", async (_req, res) => {
  // Set aggressive cache headers for sustainability data (rarely changes)
  // Phase 1 optimization: 3600s (1 hour) → 10800s (3 hours)
  res.setHeader("Cache-Control", "public, max-age=10800, s-maxage=10800");
  res.setHeader("X-Cache-TTL", "10800");
  res.setHeader("Vary", "Accept-Encoding");

  const hero = await withTimeout(
    sustainabilityRepository.getSustainabilityHero(),
    10000,
    "Get sustainability hero",
  );
  return res.json(hero || null);
});

router.patch("/admin/sustainability-hero", authService.requireAdmin, async (req, res) => {
  const validation = insertSustainabilityHeroSchema.partial().safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }
  const hero = await withTimeout(
    sustainabilityRepository.updateSustainabilityHero(removeUndefined(validation.data)),
    10000,
    "Update sustainability hero",
  );

  // Invalidate sustainability caches
  Promise.all([
    CacheOperations.invalidateSustainability(),
    twoTierBatchCache.invalidate("sustainability:batch"),
  ])
    .then(() => logger.info("[Sustainability] ✅ Cache invalidated after hero update"))
    .catch((cacheError) =>
      logger.error("[Sustainability] ❌ Cache invalidation failed:", cacheError),
    );

  return res.json(hero);
});

// Sustainability metrics routes moved to server/routes/resources/sustainability-metrics.routes.ts (CHUNK 7)

// Manufacturing processes routes moved to server/routes/resources/manufacturing-processes.routes.ts (CHUNK 7)
// Manufacturing Hero routes moved to server/routes/resources/manufacturing-hero.routes.ts (Refactor Phase 1)
// Manufacturing Batch endpoint REMOVED (Arch. Violation Fix - Refactor Phase 1)

// ============================================================================
// TECHNOLOGY PAGE ROUTES
// ============================================================================

// Technology batch API - optimized endpoint with stale-while-revalidate
router.get("/technology-batch", async (_req, res) => {
  const startTime = performance.now();
  // Check if cached data exists and its age
  const cacheKey = CacheKeys.technology.batch();
  const cached = await unifiedCache.get<BatchResponse>(cacheKey);
  // Standard cache check
  if (cached) {
    logger.info("[Technology] Returning cached batch data");
    res.setHeader("X-Cache-Hit", "true");
    res.setHeader("X-Response-Time", (performance.now() - startTime).toString());
    res.setHeader("X-Media-Assets-Loaded", (cached.mediaAssets?.length || 0).toString());
    return res.json(cached);
  }

  logger.info("[Technology] Cache miss - fetching from database");

  // Fetch all technology data in parallel
  const [hero, innovations, equipment, research, roadmap, cta, gradientSettings] =
    await withTimeout(
      Promise.all([
        technologyRepository.getTechnologyHero(),
        technologyRepository.getTechnologyInnovations(),
        technologyRepository.getTechnologyEquipment(),
        technologyRepository.getTechnologyResearch(),
        technologyRepository.getTechnologyRoadmap(),
        technologyRepository.getTechnologyCta(),
        technologyRepository.getTechnologyGradientSettings(),
      ]),
      20000,
      "Technology batch fetch (7 parallel queries)",
    );

  // Collect all media IDs used in technology content
  const dataToScan = [hero, innovations, equipment, research, roadmap, cta, gradientSettings];
  const mediaIds = extractMediaIds(dataToScan);

  // Fetch only the specific media assets that are actually used
  const mediaAssets =
    mediaIds.size > 0
      ? await withTimeout(
          mediaRepository.getMediaAssetsByIds(Array.from(mediaIds).map((id) => id.toString())),
          10000,
          "Fetch technology media assets by IDs",
        )
      : [];

  const batchData = {
    hero: hero || null,
    innovations: innovations || [],
    equipment: equipment || [],
    research: research || [],
    roadmap: roadmap || [],
    cta: cta || null,
    gradientSettings: gradientSettings || null,
    mediaAssets: mediaAssets || [],
    _meta: {
      fetchedAt: new Date().toISOString(),
      totalRequests: 7,
      mediaAssetsLoaded: mediaAssets.length,
      mediaIdsRequested: Array.from(mediaIds),
      responseTime: performance.now() - startTime,
    },
  };

  // CHUNK 5: Cache the batch data for 120 minutes (7200s)
  await unifiedCache.set(cacheKey, batchData, CACHE_TTL_NAVIGATION);
  logger.info("[Technology] Batch data cached for 120 minutes / 2 hours");

  res.setHeader("X-Response-Time", (performance.now() - startTime).toString());
  res.setHeader("X-Media-Assets-Loaded", mediaAssets.length.toString());
  res.setHeader("X-Cache-Hit", "false");
  return res.json(batchData);
});

// Technology hero
router.get("/technology-hero", async (_req, res) => {
  const hero = await withTimeout(
    technologyRepository.getTechnologyHero(),
    10000,
    "Get technology hero",
  );
  return res.json(hero || {});
});

router.patch("/admin/technology-hero", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyHeroSchema.partial().safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }
  const hero = await withTimeout(
    technologyRepository.updateTechnologyHero(removeUndefined(validation.data)),
    10000,
    "Update technology hero",
  );

  // CHUNK 5: Invalidate technology cache after mutation
  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[Technology] ✅ Cache invalidated after technology hero update"))
    .catch((cacheError) => logger.error("[Technology] ❌ Cache invalidation failed:", cacheError));

  return res.json(hero);
});

// Technology innovations routes moved to server/routes/resources/technology-innovations.routes.ts (CHUNK 7)

export default router;
