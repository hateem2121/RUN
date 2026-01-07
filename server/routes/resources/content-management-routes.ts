import { removeUndefined } from "../../utils.js";

/**
 * PHASE 3.2: CONTENT MANAGEMENT ROUTES EXTRACTION
 *
 * Contact, Navigation, About, and UI/Design Settings Routes
 * Extracted from main routes.ts for better organization
 */

import { type Request, Router } from "express";
import { z } from "zod";
import {
  insertContactPageConfigurationSchema,
  insertLogoAnimationSettingsSchema,
  insertNavigationGlassmorphismSettingsSchema,
  insertNavigationItemSchema,
} from "../../../shared/schema.js";
import { CacheKeys, CacheOperations } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased TTLs to improve cache hit rate (60% → 70%+ target)
const CACHE_TTL_STATIC = 10800; // 180 minutes (3 hours) - static settings change rarely
const CACHE_TTL_NAVIGATION = 7200; // 120 minutes (2 hours) - navigation items change occasionally

/**
 * CHUNK 7: Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

// ============================================================================
// CONTACT MANAGEMENT ROUTES
// ============================================================================

// Contact page configuration
router.get("/contact-page-configuration", async (_req, res) => {
  try {
    const config = await withTimeout(
      getStorage().getContactPageConfiguration(),
      5000,
      "Get contact page config",
    );
    return res.json(config || {});
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get contact page configuration",
    });
  }
});

// prettier-ignore
router.post("/contact-page-configuration", authService.requireAdmin, async (req, res) => {
  try {
    const validation = insertContactPageConfigurationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }

    const config = await withTimeout(
      getStorage().createContactPageConfiguration(validation.data),
      5000,
      "Create contact page config",
    );

    // Invalidate contact page cache after successful creation
    try {
      await CacheOperations.invalidateContact();
      logger.info("[Contact] ✅ Cache invalidated after contact page configuration creation");
    } catch (err) {
      logger.error("[Contact] ❌ Cache invalidation failed:", err);
      // Don't throw - cache failure should not block DB mutation
    }

    return res.json(config);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create contact page configuration",
    });
  }
});

// prettier-ignore
router.patch("/contact-page-configuration", authService.requireAdmin, async (req, res) => {
  try {
    const validation = insertContactPageConfigurationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    // Contact page configuration is a singleton - always use ID 1
    const config = await withTimeout(
      getStorage().updateContactPageConfiguration(1, validation.data),
      5000,
      "Update contact page config",
    );

    // CHUNK 2: Invalidate contact page cache after successful update
    try {
      await CacheOperations.invalidateContact();
      logger.info("[Contact] ✅ Cache invalidated after contact page configuration update");
    } catch (err) {
      logger.error("[Contact] ❌ Cache invalidation failed:", err);
      // Don't throw - cache failure should not block DB mutation
    }

    return res.json(config);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update contact page configuration",
    });
  }
});

// ============================================================================
// NAVIGATION MANAGEMENT ROUTES
// ============================================================================

import { ApiError } from "../../lib/errors/api-error.js";
import { NavigationService } from "../../services/navigation-service.js";

// Simple test route first
router.get("/navigation-test", async (_req, res) => {
  return res.json({
    message: "Navigation route system working",
    timestamp: new Date().toISOString(),
  });
});

// Get all navigation items
router.get("/navigation-items", async (req, res) => {
  try {
    const bypassCache = shouldBypassCache(req);
    const result = await NavigationService.getItems(bypassCache);

    if (result.metadata.ttl > 0) {
      res.setHeader("Cache-Control", `public, max-age=${result.metadata.ttl}`);
    } else {
      res.setHeader("Cache-Control", "no-cache, max-age=0");
    }

    res.setHeader("X-Cache-Hit", String(result.metadata.cacheHit));
    res.setHeader("X-Response-Time", String(result.metadata.responseTime));
    if (bypassCache) res.setHeader("X-Admin-Request", "true");

    return res.json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch navigation items",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get specific navigation item
router.get("/navigation-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await NavigationService.getItem(id);
    return res.json(item);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to fetch navigation item" });
  }
});

// Create navigation item
router.post("/navigation-items", authService.requireAdmin, async (req, res) => {
  try {
    const validatedData = insertNavigationItemSchema.parse(req.body);
    const newItem = await NavigationService.createItem(validatedData);
    return res.status(201).json(newItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to create navigation item" });
  }
});

// Bulk reorder navigation items
router.patch("/navigation-items/reorder", authService.requireAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    const reorderSchema = z.object({
      items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
    });
    const validatedData = reorderSchema.parse({ items });

    const updatedItems = await NavigationService.reorderItems(validatedData.items);
    return res.json(updatedItems);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    return res.status(500).json({
      message: "Failed to reorder navigation items",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Update navigation item
router.patch("/navigation-items/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id!, 10);
    const validatedData = insertNavigationItemSchema.partial().parse(req.body);
    const updated = await NavigationService.updateItem(id, validatedData);
    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    if (error instanceof ApiError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update navigation item" });
  }
});

// Delete navigation item
router.delete("/navigation-items/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id!, 10);
    await NavigationService.deleteItem(id);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to delete navigation item" });
  }
});

// Navigation glassmorphism settings
router.get("/navigation-glassmorphism-settings", async (_req, res) => {
  try {
    const settings = await NavigationService.getGlassmorphismSettings();
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get navigation glassmorphism settings",
    });
  }
});

// Update glassmorphism settings
router.patch("/navigation-glassmorphism-settings", authService.requireAdmin, async (req, res) => {
  try {
    const validation = insertNavigationGlassmorphismSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const settings = await NavigationService.updateGlassmorphismSettings(validation.data);
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to update navigation glassmorphism settings",
    });
  }
});

// ============================================================================
// UI/DESIGN SETTINGS ROUTES
// ============================================================================

// Logo animation settings - CHUNK 5: Added caching
router.get("/logo-animation-settings", async (_req, res) => {
  try {
    const cacheKey = "logo-animation-settings";
    const cached = await unifiedCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const settings = await withTimeout(
      getStorage().getLogoAnimationSettings(),
      5000,
      "Get logo animation settings",
    );
    const result = settings || {};
    await unifiedCache.set(cacheKey, result, CACHE_TTL_STATIC * 1000);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get logo animation settings",
    });
  }
});

// prettier-ignore
router.patch("/logo-animation-settings", authService.requireAdmin, async (req, res) => {
  try {
    const validation = insertLogoAnimationSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    const settings = await withTimeout(
      getStorage().updateLogoAnimationSettings(validation.data),
      5000,
      "Update logo animation settings",
    );
    // CHUNK 5: Clear cache when settings change
    await unifiedCache.delete("logo-animation-settings");
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update logo animation settings",
    });
  }
});

export default router;
