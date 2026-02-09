/**
 * NAVIGATION ROUTES MODULE
 * Handles public navigation items and settings
 */

import express from "express";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { logger } from "../../lib/monitoring/logger.js";
import { getStorage } from "../../lib/storage-singleton.js";

const router = express.Router();

// Cache TTL (2 hours for navigation data)
const CACHE_TTL = 7200;

/**
 * GET /navigation-items
 * Returns all active navigation items ordered by sort order
 */
router.get("/navigation-items", async (req, res) => {
  const cacheKey = "navigation:items:public";

  try {
    const cached = await unifiedCache.get<any[]>(cacheKey);
    if (cached && !req.query.nocache) {
      return res.json(cached);
    }

    const storage = getStorage();
    const items = await storage.getNavigationItems();

    // In current implementation, getNavigationItems handles sorting and activity filtering
    await unifiedCache.set(cacheKey, items, CACHE_TTL * 1000);

    return res.json(items);
  } catch (error) {
    logger.error("[Navigation] Failed to fetch navigation items:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /navigation-settings
 * Returns navigation-specific UI settings (glassmorphism, etc.)
 */
router.get("/navigation-settings", async (req, res) => {
  const cacheKey = "navigation:settings:public";

  try {
    const cached = await unifiedCache.get<any>(cacheKey);
    if (cached && !req.query.nocache) {
      return res.json(cached);
    }

    const storage = getStorage();
    const settings = await storage.getNavigationGlassmorphismSettings();

    await unifiedCache.set(cacheKey, settings, CACHE_TTL * 1000);

    return res.json(settings);
  } catch (error) {
    logger.error("[Navigation] Failed to fetch navigation settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

logger.debug("[Navigation Routes] ✅ Navigation routes loaded");

export default router;
