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
import { CacheKeys, CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { unifiedCache } from "../../lib/unified-cache.js";

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

router.post("/contact-page-configuration", async (req, res) => {
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

router.patch("/contact-page-configuration", async (req, res) => {
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

// Simple test route first
router.get("/navigation-test", async (_req, res) => {
  return res.json({
    message: "Navigation route system working",
    timestamp: new Date().toISOString(),
  });
});

// Get all navigation items - CHUNK 4: Added caching with conditional TTL
router.get("/navigation-items", async (req, res) => {
  const startTime = performance.now();
  try {
    // CHUNK 3: Defensive transformation - supports legacy label/url fields during transition period
    const normalizeNavigationItems = (items: any[]) =>
      items.map((item) => ({
        ...item,
        title: item.title || item.label || "",
        href: item.href || item.url || "#",
      }));

    // CHUNK 7: For admin/debug requests, skip cache for real-time updates
    if (shouldBypassCache(req)) {
      logger.info("[Navigation] Admin request detected - bypassing cache for real-time data");
      const navigationItems = await withTimeout(
        getStorage().getNavigationItems(),
        5000,
        "Get navigation items (admin)",
      );
      logger.debug(
        "[Navigation DEBUG] Raw from DB:",
        JSON.stringify(navigationItems.slice(0, 2), null, 2),
      );
      const normalizedItems = normalizeNavigationItems(navigationItems);
      logger.debug(
        "[Navigation DEBUG] After normalization:",
        JSON.stringify(normalizedItems.slice(0, 2), null, 2),
      );

      res.setHeader("Cache-Control", "no-cache, max-age=0");
      res.setHeader("X-Admin-Request", "true");
      res.setHeader("X-Response-Time", (performance.now() - startTime).toString());
      return res.json(normalizedItems);
    }

    // CHUNK 4: For public requests, use cache (NEON cost optimization)
    const cacheKey = CacheKeys.navigation.items();
    const cached = (await unifiedCache.get(cacheKey)) as any;

    if (cached) {
      logger.info("[Navigation] Returning cached navigation items (public)");
      res.setHeader("Cache-Control", "public, max-age=7200"); // 120 minutes - Phase 1 optimization
      res.setHeader("X-Cache-Hit", "true");
      res.setHeader("X-Response-Time", (performance.now() - startTime).toString());
      const normalized = normalizeNavigationItems(Array.isArray(cached) ? cached : [cached]);
      return res.json(normalized);
    }

    logger.info("[Navigation] Cache miss - fetching from database (public)");

    const navigationItems = await withTimeout(
      getStorage().getNavigationItems(),
      5000,
      "Get navigation items (public)",
    );

    // CHUNK 3: Normalize before caching to ensure consistent structure
    const normalizedItems = normalizeNavigationItems(navigationItems);

    // CHUNK 4: Cache the normalized navigation items for 120 minutes (7200s)
    await unifiedCache.set(cacheKey, normalizedItems, CACHE_TTL_NAVIGATION * 1000);
    logger.info("[Navigation] Navigation items cached for 120 minutes / 2 hours (public)");

    res.setHeader("Cache-Control", "public, max-age=7200");
    res.setHeader("X-Response-Time", (performance.now() - startTime).toString());
    res.setHeader("X-Cache-Hit", "false");
    return res.json(normalizedItems);
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
    const id = parseInt(req.params.id);
    const navigationItem = await withTimeout(
      getStorage().getNavigationItem(id),
      5000,
      "Get navigation item",
    );
    if (!navigationItem) {
      return res.status(404).json({ message: "Navigation item not found" });
    }
    return res.json(navigationItem);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch navigation item" });
  }
});

// Create navigation item
router.post("/navigation-items", async (req, res) => {
  try {
    const validatedData = insertNavigationItemSchema.parse(req.body);
    // CHUNK 2: Populate BOTH legacy (label/url) AND modern (title/href) columns for compatibility
    // Database requires 'label' as notNull, but frontend uses 'title/href'
    const navigationItemData = {
      // Modern fields (frontend uses these)
      title: validatedData.title,
      href: validatedData.href,
      // Legacy fields (database requires label as notNull)
      label: validatedData.title,
      url: validatedData.href,
      // Other fields
      iconType: validatedData.iconType,
      iconSize: validatedData.iconSize,
      fallbackIcon: validatedData.fallbackIcon,
      mediaIconId: validatedData.mediaIconId,
      sortOrder: validatedData.sortOrder,
      isActive: validatedData.isActive ?? true,
      showOnDesktop: validatedData.showOnDesktop ?? true,
      showOnMobile: validatedData.showOnMobile ?? true,
    };
    const navigationItem = await withTimeout(
      getStorage().createNavigationItem(navigationItemData),
      5000,
      "Create navigation item",
    );

    // CHUNK 4: Invalidate navigation cache after successful creation
    try {
      await CacheOperations.invalidateNavigation();
      logger.info("[Navigation] ✅ Cache invalidated after navigation item creation");
    } catch (err) {
      logger.error("[Navigation] ❌ Cache invalidation failed:", err);
      // Don't throw - cache failure should not block DB mutation
    }

    return res.status(201).json(navigationItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to create navigation item" });
  }
});

// Bulk reorder navigation items
router.patch("/navigation-items/reorder", async (req, res) => {
  try {
    const { items } = req.body;
    const reorderSchema = z.object({
      items: z.array(
        z.object({
          id: z.number(),
          sortOrder: z.number(),
        }),
      ),
    });

    const validatedData = reorderSchema.parse({ items });

    // NEON HTTP driver doesn't support transactions, so we update sequentially
    // Note: This is not atomic, but works for admin operations
    const startTime = Date.now();
    const storage = getStorage();

    for (const item of validatedData.items) {
      const result = await withTimeout(
        storage.updateNavigationItem(item.id, {
          sortOrder: item.sortOrder,
        }),
        5000,
        `Update navigation item ${item.id}`,
      );
      if (!result) {
        throw new Error(`Navigation item with ID ${item.id} not found`);
      }
    }
    const duration = Date.now() - startTime;

    logger.debug(
      `[Transaction] Bulk navigation reorder completed in ${duration}ms (${validatedData.items.length} items)`,
    );

    // CHUNK 4: Invalidate navigation cache after successful reorder
    try {
      await CacheOperations.invalidateNavigation();
      logger.info("[Navigation] ✅ Cache invalidated after navigation items reorder");
    } catch (err) {
      logger.error("[Navigation] ❌ Cache invalidation failed:", err);
      // Don't throw - cache failure should not block DB mutation
    }

    const updatedItems = await withTimeout(
      getStorage().getNavigationItems(),
      5000,
      "Get updated navigation items",
    );

    // Ensures frontend receives normalized navigation items after order mutation
    const normalizedItems = updatedItems.map((item) => ({
      ...item,
      title: item.title || item.label || "Untitled",
      href: item.href || item.url || "#",
    }));

    return res.json(normalizedItems);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    // Enhanced error logging
    logger.error("[Navigation Reorder] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error,
    });
    return res.status(500).json({
      message: "Failed to reorder navigation items",
      error: error instanceof Error ? error.message : String(error),
      details: JSON.stringify(error),
    });
  }
});

// Update navigation item
router.patch("/navigation-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertNavigationItemSchema.partial().parse(req.body);

    // Apply defensive defaults for boolean fields when explicitly provided
    const updateData = {
      ...validatedData,
      ...(validatedData.isActive !== undefined && {
        isActive: validatedData.isActive ?? true,
      }),
      ...(validatedData.showOnDesktop !== undefined && {
        showOnDesktop: validatedData.showOnDesktop ?? true,
      }),
      ...(validatedData.showOnMobile !== undefined && {
        showOnMobile: validatedData.showOnMobile ?? true,
      }),
    };

    const navigationItem = await withTimeout(
      getStorage().updateNavigationItem(id, updateData),
      5000,
      "Update navigation item",
    );
    if (!navigationItem) {
      return res.status(404).json({ message: "Navigation item not found" });
    }

    // CHUNK 4: Invalidate navigation cache after successful update
    try {
      await CacheOperations.invalidateNavigation();
      logger.info("[Navigation] ✅ Cache invalidated after navigation item update");
    } catch (err) {
      logger.error("[Navigation] ❌ Cache invalidation failed:", err);
      // Don't throw - cache failure should not block DB mutation
    }

    return res.json(navigationItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to update navigation item" });
  }
});

// Delete navigation item
router.delete("/navigation-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await withTimeout(
      getStorage().deleteNavigationItem(id),
      5000,
      "Delete navigation item",
    );
    if (!success) {
      return res.status(404).json({ message: "Navigation item not found" });
    }

    // CHUNK 4: Invalidate navigation cache after successful deletion
    try {
      await CacheOperations.invalidateNavigation();
      logger.info("[Navigation] ✅ Cache invalidated after navigation item deletion");
    } catch (err) {
      logger.error("[Navigation] ❌ Cache invalidation failed:", err);
      // Don't throw - cache failure should not block DB mutation
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete navigation item" });
  }
});

// Navigation glassmorphism settings - CHUNK 5: Added caching
router.get("/navigation-glassmorphism-settings", async (_req, res) => {
  try {
    const cacheKey = "navigation-glassmorphism-settings";
    const cached = await unifiedCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const settings = await withTimeout(
      getStorage().getNavigationGlassmorphismSettings(),
      5000,
      "Get glassmorphism settings",
    );
    // Returns default glassmorphism settings when DB is empty/uninitialized
    const defaultSettings = {
      enabled: true,
      backgroundOpacity: "15",
      blurStrength: 5,
      borderOpacity: "30",
      shadowIntensity: "10",
      topHighlightOpacity: "80",
      leftHighlightOpacity: "80",
      innerShadowOpacity: "50",
      borderRadius: 20,
    };
    const result = settings || defaultSettings;
    await unifiedCache.set(cacheKey, result, CACHE_TTL_STATIC * 1000);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get navigation glassmorphism settings",
    });
  }
});

router.patch("/navigation-glassmorphism-settings", async (req, res) => {
  try {
    const validation = insertNavigationGlassmorphismSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }
    // Convert opacity from number to string (database uses decimal type)
    const settingsData = {
      ...validation.data,
      opacity: validation.data.opacity !== undefined ? String(validation.data.opacity) : undefined,
    };
    const settings = await withTimeout(
      getStorage().updateNavigationGlassmorphismSettings(settingsData),
      5000,
      "Update glassmorphism settings",
    );
    // CHUNK 5: Clear cache when settings change
    await unifiedCache.delete("navigation-glassmorphism-settings");
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

router.patch("/logo-animation-settings", async (req, res) => {
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
