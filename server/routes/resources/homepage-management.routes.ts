/**
 * HOMEPAGE MANAGEMENT ROUTES MODULE
 * Page-specific CRUD operations for Homepage content
 * Relocated from modules/ to resources/ for consistent architecture (October 15, 2025)
 *
 * HTTP CACHE-BUSTING IMPLEMENTATION (October 15, 2025):
 * All GET endpoints now include Cache-Control headers to prevent 304 Not Modified responses.
 * This ensures admin changes appear immediately in frontend without hard refresh.
 *
 * Modified GET endpoints with cache-busting headers:
 * ✅ GET /api/homepage-hero - Hero section data
 * ✅ GET /api/homepage-slogans - All slogans list
 * ✅ GET /api/homepage-slogans/:id - Single slogan by ID
 * ✅ GET /api/homepage-process-cards - All process cards list
 * ✅ GET /api/homepage-process-cards/:id - Single process card by ID
 * ✅ GET /api/homepage-sections - All sections list
 * ✅ GET /api/homepage-sections/:name - Single section by name

 * ✅ GET /api/homepage-featured-products-settings - Featured products configuration
 *
 * Cache-busting headers applied to each endpoint:
 * - Cache-Control: no-cache, no-store, must-revalidate
 * - Pragma: no-cache
 * - Expires: 0
 *
 * Note: Server-side caching (UnifiedCache) remains active for performance.
 * Only HTTP/browser caching is disabled to ensure real-time updates.
 */

import express, { type Request } from "express";
// Import validation schemas and types
import {
  type HomepageFeaturedProductsSettings,
  type HomepageHero,
  type HomepageSection,
  type HomepageSlogan,
  insertHomepageFeaturedProductsSettingsSchema,
  insertHomepageHeroSchema,
  insertHomepageProcessCardSchema,
  insertHomepageSectionSchema,
  insertHomepageSloganSchema,
} from "../../../shared/schema.js";
import { CacheKeys, CacheOperations } from "../../lib/cache-strategies.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { unifiedCache } from "../../lib/unified-cache.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = express.Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased from 3600s (60min) to 10800s (180min)
const CACHE_TTL_STATIC = 10800; // 180 minutes (3 hours) - homepage content data changes rarely

/**
 * CHUNK 7: Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

// CHUNK 1: Cache invalidation helper using CacheOperations with try-catch
const invalidateHomepageCache = async () => {
  try {
    await CacheOperations.invalidateHomepage();
    logger.info("[Homepage Management] ✅ Cache invalidated via CacheOperations");
  } catch (err) {
    logger.error("[Homepage Management] ❌ Cache invalidation failed:", err);
    // Don't throw - cache failure should not block DB mutations
  }
};

// ================================
// HOMEPAGE HERO ROUTES (2 routes)
// ================================

// Get homepage hero - CHUNK 5: Added caching for configuration endpoints
router.get(
  "/homepage-hero",
  asyncHandler(async (req, res) => {
    const cacheKey = CacheKeys.homepage.hero();
    const cached = await unifiedCache.get<HomepageHero | {}>(cacheKey);

    // CHUNK 7: Check cache bypass
    if (cached && !shouldBypassCache(req)) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Cache-Hit", "true");
      return res.json(cached);
    }

    if (shouldBypassCache(req)) {
      logger.debug("[Homepage] Admin/debug request - bypassing cache for hero");
    }

    const hero = await getStorage().getHomepageHero();
    const result = hero || {};
    await unifiedCache.set(cacheKey, result, CACHE_TTL_STATIC * 1000);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.json(result);
  }),
);

// Update homepage hero
router.patch(
  "/homepage-hero",
  asyncHandler(async (req, res) => {
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("[STEP 5: BACKEND] PATCH /api/homepage-hero - Received request");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📥 Request body:", JSON.stringify(req.body));
    logger.info("🔹 backgroundImageId in request:", req.body.backgroundImageId);
    logger.info("🔹 Timestamp:", new Date().toISOString());

    const validation = insertHomepageHeroSchema.safeParse(req.body);
    if (!validation.success) {
      logger.error("❌ Validation failed:", validation.error.message);
      return res.status(400).json({ error: validation.error.message });
    }

    logger.info("✅ Validation passed, updating hero in database...");
    logger.info("📦 Validated data:", JSON.stringify(validation.data));

    const hero = await getStorage().updateHomepageHero(validation.data);

    logger.info("✅ Hero updated in database successfully");
    logger.info("📦 Updated hero data:", JSON.stringify(hero));
    logger.info("🔹 backgroundImageId saved:", hero.backgroundImageId);

    logger.info("🔄 Invalidating homepage cache...");
    await invalidateHomepageCache();
    logger.info("✅ Cache invalidated");

    logger.info("📤 Sending response to frontend");
    logger.info("⏭️  NEXT: Frontend should refetch and user page should display new background");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return res.json(hero);
  }),
);

// ================================
// HOMEPAGE SLOGANS ROUTES (6 routes)
// ================================

// Get all homepage slogans - CHUNK 5: Added caching for configuration endpoints
router.get(
  "/homepage-slogans",
  asyncHandler(async (req, res) => {
    const cacheKey = CacheKeys.homepage.slogans();
    const cached = await unifiedCache.get<HomepageSlogan[]>(cacheKey);

    // CHUNK 7: Check cache bypass
    if (cached && !shouldBypassCache(req)) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Cache-Hit", "true");
      return res.json(cached);
    }

    if (shouldBypassCache(req)) {
      logger.debug("[Homepage] Admin/debug request - bypassing cache for slogans");
    }

    const slogans = await getStorage().getHomepageSlogans();
    const result = slogans || [];
    await unifiedCache.set(cacheKey, result, CACHE_TTL_STATIC * 1000);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.json(result);
  }),
);

// Get single homepage slogan by ID
router.get(
  "/homepage-slogans/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const slogan = await getStorage().getHomepageSlogan(id);
    if (!slogan) {
      return res.status(404).json({ message: "Slogan not found" });
    }
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.json(slogan);
  }),
);

// Create homepage slogan
router.post(
  "/homepage-slogans",
  asyncHandler(async (req, res) => {
    const validation = insertHomepageSloganSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const slogan = await getStorage().createHomepageSlogan(validation.data);
    await invalidateHomepageCache();
    return res.status(201).json(slogan);
  }),
);

// Update homepage slogan
router.patch(
  "/homepage-slogans/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const validation = insertHomepageSloganSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const slogan = await getStorage().updateHomepageSlogan(id, validation.data);
    if (!slogan) {
      return res.status(404).json({ message: "Slogan not found" });
    }
    await invalidateHomepageCache();
    return res.json(slogan);
  }),
);

// Delete homepage slogan
router.delete(
  "/homepage-slogans/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const deleted = await getStorage().deleteHomepageSlogan(id);
    if (!deleted) {
      return res.status(404).json({ message: "Slogan not found" });
    }
    await invalidateHomepageCache();
    return res.status(204).send();
  }),
);

// Reorder homepage slogans
router.patch(
  "/homepage-slogans/reorder",
  asyncHandler(async (req, res) => {
    const { slogans } = req.body;
    if (!Array.isArray(slogans)) {
      return res.status(400).json({ message: "Slogans must be an array" });
    }
    const reorderedSlogans = await getStorage().reorderHomepageSlogans(slogans);
    await invalidateHomepageCache();
    return res.json(reorderedSlogans);
  }),
);

// ================================
// HOMEPAGE PROCESS CARDS ROUTES (6 routes)
// ================================

// Get all process cards - CHUNK 5: Added caching for configuration endpoints
// Get all process cards (ADMIN ONLY - BYPASS CACHE)
router.get(
  "/homepage-process-cards/admin",
  asyncHandler(async (req, res) => {
    if (shouldBypassCache(req)) {
      logger.debug("[Homepage] Admin request - bypassing cache for process cards");
    }

    // FORCE FRESH READ + INCLUDE INACTIVE
    const cards = await getStorage().getHomepageProcessCards(true);

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.json(cards || []);
  }),
);

// KEEP Public Endpoint for fallback (though likely handled by batch router)
router.get(
  "/homepage-process-cards",
  asyncHandler(async (_req, res) => {
    // Delegate to batch router logic or return active only
    const cards = await getStorage().getHomepageProcessCards(false);
    return res.json(cards || []);
  }),
);
// Get single process card by ID
router.get(
  "/homepage-process-cards/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const card = await getStorage().getHomepageProcessCard(id);
    if (!card) {
      return res.status(404).json({ message: "Process card not found" });
    }
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.json(card);
  }),
);

// Create process card
router.post(
  "/homepage-process-cards",
  asyncHandler(async (req, res) => {
    const validation = insertHomepageProcessCardSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const card = await getStorage().createHomepageProcessCard(validation.data);
    await invalidateHomepageCache();
    return res.status(201).json(card);
  }),
);

// Update process card
router.patch(
  "/homepage-process-cards/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const validation = insertHomepageProcessCardSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const card = await getStorage().updateHomepageProcessCard(id, validation.data);
    if (!card) {
      return res.status(404).json({ message: "Process card not found" });
    }
    await invalidateHomepageCache();
    return res.json(card);
  }),
);

// Delete process card
router.delete(
  "/homepage-process-cards/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const deleted = await getStorage().deleteHomepageProcessCard(id);
    if (!deleted) {
      return res.status(404).json({ message: "Process card not found" });
    }
    await invalidateHomepageCache();
    return res.status(204).send();
  }),
);

// Reorder process cards
router.patch(
  "/homepage-process-cards/reorder",
  asyncHandler(async (req, res) => {
    const { cards } = req.body;
    if (!Array.isArray(cards)) {
      return res.status(400).json({ message: "Cards must be an array" });
    }
    const reorderedCards = await getStorage().reorderHomepageProcessCards(cards);
    await invalidateHomepageCache();
    return res.json(reorderedCards);
  }),
);

// ================================
// HOMEPAGE SECTIONS ROUTES (3 routes)
// ================================

// Get all homepage sections - CHUNK 5: Added caching for configuration endpoints
router.get(
  "/homepage-sections",
  asyncHandler(async (req, res) => {
    const cacheKey = CacheKeys.homepage.sections();
    const cached = await unifiedCache.get<HomepageSection[]>(cacheKey);

    // CHUNK 7: Check cache bypass
    if (cached && !shouldBypassCache(req)) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Cache-Hit", "true");
      return res.json(cached);
    }

    if (shouldBypassCache(req)) {
      logger.debug("[Homepage] Admin/debug request - bypassing cache for sections");
    }

    const sections = await getStorage().getHomepageSections(shouldBypassCache(req));
    const result = sections || [];
    await unifiedCache.set(cacheKey, result, CACHE_TTL_STATIC * 1000);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.json(result);
  }),
);

// Get single homepage section by ID
router.get(
  "/homepage-sections/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const section = await getStorage().getHomepageSectionById(id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.json(section);
  }),
);

// Update homepage section
router.patch(
  "/homepage-sections/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id!, 10);
    const validation = insertHomepageSectionSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const section = await getStorage().updateHomepageSectionById(id, validation.data);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }
    await invalidateHomepageCache();
    return res.json(section);
  }),
);

// ================================
// HOMEPAGE FEATURED PRODUCTS SETTINGS ROUTES (2 routes)
// ================================

// Get featured products settings - CHUNK 5: Added caching for configuration endpoints
router.get(
  "/homepage-featured-products-settings",
  asyncHandler(async (req, res) => {
    const cacheKey = CacheKeys.homepage.featuredProducts();
    const cached = await unifiedCache.get<HomepageFeaturedProductsSettings | {}>(cacheKey);

    // CHUNK 7: Check cache bypass
    if (cached && !shouldBypassCache(req)) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Cache-Hit", "true");
      return res.json(cached);
    }

    if (shouldBypassCache(req)) {
      logger.debug(
        "[Homepage] Admin/debug request - bypassing cache for featured products settings",
      );
    }

    const settings = await getStorage().getHomepageFeaturedProductsSettings();
    const result = settings || {};
    await unifiedCache.set(cacheKey, result, CACHE_TTL_STATIC * 1000);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.json(result);
  }),
);

// Update featured products settings
router.patch(
  "/homepage-featured-products-settings",
  asyncHandler(async (req, res) => {
    const validation = insertHomepageFeaturedProductsSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const settings = await getStorage().updateHomepageFeaturedProductsSettings(validation.data);
    await invalidateHomepageCache();
    return res.json(settings);
  }),
);

logger.debug("[Homepage Management] ✅ Homepage management routes loaded (resources/, 21 routes)");

export default router;
