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
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { safeQuery } from "../../db.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased TTLs to improve cache hit rate (60% → 70%+ target)
const CACHE_TTL_STATIC = 10800; // 180 minutes (3 hours) - static settings change rarely
const _CACHE_TTL_NAVIGATION = 7200; // 120 minutes (2 hours) - navigation items change occasionally

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
router.get("/contact-page-configuration", async (_req, res, next) => {
  const result = await safeQuery(
    withTimeout(
      getStorage().getContactPageConfiguration(),
      5000,
      "Get contact page config",
    ),
  );

  if (result.isErr()) {
    return next(result.error);
  }

  return res.json(result.value || {});
});

// prettier-ignore
// prettier-ignore
router.post("/contact-page-configuration", authService.requireAdmin, async (req, res, next) => {
  const validation = insertContactPageConfigurationSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError("Invalid contact configuration", { issues: validation.error.issues }));
  }

  const result = await safeQuery(
    withTimeout(
      getStorage().createContactPageConfiguration(validation.data),
      5000,
      "Create contact page config",
    ),
  );

  if (result.isErr()) {
    return next(result.error);
  }

  // Invalidate contact page cache after successful creation
  try {
    await CacheOperations.invalidateContact();
    logger.info("[Contact] ✅ Cache invalidated after contact page configuration creation");
  } catch (err) {
    logger.error("[Contact] ❌ Cache invalidation failed:", err);
    // Don't throw - cache failure should not block DB mutation
  }

  return res.json(result.value);
});

// prettier-ignore
// prettier-ignore
router.patch("/contact-page-configuration", authService.requireAdmin, async (req, res, next) => {
  const validation = insertContactPageConfigurationSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError("Invalid contact configuration", { issues: validation.error.issues }));
  }
  // Contact page configuration is a singleton - always use ID 1
  const result = await safeQuery(
    withTimeout(
      getStorage().updateContactPageConfiguration(1, validation.data),
      5000,
      "Update contact page config",
    ),
  );

  if (result.isErr()) {
    return next(result.error);
  }

  // CHUNK 2: Invalidate contact page cache after successful update
  try {
    await CacheOperations.invalidateContact();
    logger.info("[Contact] ✅ Cache invalidated after contact page configuration update");
  } catch (err) {
    logger.error("[Contact] ❌ Cache invalidation failed:", err);
    // Don't throw - cache failure should not block DB mutation
  }

  return res.json(result.value);
});

// ============================================================================
// NAVIGATION MANAGEMENT ROUTES
// ============================================================================

import { NavigationService } from "../../services/navigation-service.js";

// Simple test route first
router.get("/navigation-test", async (_req, res) => {
  return res.json({
    message: "Navigation route system working",
    timestamp: new Date().toISOString(),
  });
});

// Get all navigation items
router.get("/navigation-items", async (req, res, next) => {
  const bypassCache = shouldBypassCache(req);
  const result = await NavigationService.getItems(bypassCache);

  if (result.isErr()) {
      return next(result.error);
  }

  const data = result.value;

  if (data.metadata.ttl > 0) {
    res.setHeader("Cache-Control", `public, max-age=${data.metadata.ttl}`);
  } else {
    res.setHeader("Cache-Control", "no-cache, max-age=0");
  }

  res.setHeader("X-Cache-Hit", String(data.metadata.cacheHit));
  res.setHeader("X-Response-Time", String(data.metadata.responseTime));
  if (bypassCache) res.setHeader("X-Admin-Request", "true");

  return res.json(data.data);
});

// Get specific navigation item
router.get("/navigation-items/:id", async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const result = await NavigationService.getItem(id);
  
  if (result.isErr()) {
      return next(result.error);
  }
  return res.json(result.value);
});

// Create navigation item
router.post("/navigation-items", authService.requireAdmin, async (req, res, next) => {
  const validatedData = insertNavigationItemSchema.safeParse(req.body);
  if (!validatedData.success) {
    return next(new ValidationError("Invalid navigation item", { issues: validatedData.error.issues }));
  }
  
  // NavigationService likely wraps DB calls internally, but we can wrap it here too for safety/consistency 
  // if it returns a Promise. Assuming NavigationService.* methods throw on DB error.
  const result = await NavigationService.createItem(validatedData.data);
  
  if (result.isErr()) {
      return next(result.error);
  }

  return res.status(201).json(result.value);
});

// Bulk reorder navigation items
router.patch("/navigation-items/reorder", authService.requireAdmin, async (req, res, next) => {
  const { items } = req.body;
  const reorderSchema = z.object({
    items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
  });
  const validation = reorderSchema.safeParse({ items });

  if (!validation.success) {
      return next(new ValidationError("Invalid reorder data", { issues: validation.error.issues }));
  }

  const result = await NavigationService.reorderItems(validation.data.items);

  if (result.isErr()) {
      return next(result.error);
  }
  return res.json(result.value);
});

// Update navigation item
router.patch("/navigation-items/:id", authService.requireAdmin, async (req, res, next) => {
  const id = parseInt(req.params.id!, 10);
  const validatedData = insertNavigationItemSchema.partial().safeParse(req.body);
  
  if (!validatedData.success) {
      return next(new ValidationError("Invalid update data", { issues: validatedData.error.issues }));
  }

  const result = await NavigationService.updateItem(id, validatedData.data);

  if (result.isErr()) {
      return next(result.error);
  }
  return res.json(result.value);
});

// Delete navigation item
router.delete("/navigation-items/:id", authService.requireAdmin, async (req, res, next) => {
  const id = parseInt(req.params.id!, 10);
  const result = await NavigationService.deleteItem(id);

  if (result.isErr()) {
      return next(result.error);
  }
  return res.status(204).send();
});

// Navigation glassmorphism settings
router.get("/navigation-glassmorphism-settings", async (_req, res, next) => {
  const result = await NavigationService.getGlassmorphismSettings();

  if (result.isErr()) {
      return next(result.error);
  }
  return res.json(result.value);
});

// Update glassmorphism settings
router.patch("/navigation-glassmorphism-settings", authService.requireAdmin, async (req, res, next) => {
  const validation = insertNavigationGlassmorphismSettingsSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError("Invalid glassmorphism settings", { issues: validation.error.issues }));
  }
  const result = await NavigationService.updateGlassmorphismSettings(validation.data);

  if (result.isErr()) {
      return next(result.error);
  }
  return res.json(result.value);
});

// ============================================================================
// UI/DESIGN SETTINGS ROUTES
// ============================================================================

// Logo animation settings - CHUNK 5: Added caching
router.get("/logo-animation-settings", async (_req, res, next) => {
  const cacheKey = "logo-animation-settings";
  const cached = await unifiedCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const result = await safeQuery(
    withTimeout(
      getStorage().getLogoAnimationSettings(),
      5000,
      "Get logo animation settings",
    ),
  );

  if (result.isErr()) {
      return next(result.error);
  }

  const settings = result.value || {};
  await unifiedCache.set(cacheKey, settings, CACHE_TTL_STATIC * 1000);
  return res.json(settings);
});

// prettier-ignore
router.patch("/logo-animation-settings", authService.requireAdmin, async (req, res, next) => {
  const validation = insertLogoAnimationSettingsSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError("Invalid logo settings", { issues: validation.error.issues }));
    // return res.status(400).json({ error: validation.error.message });
  }
  const result = await safeQuery(
    withTimeout(
      getStorage().updateLogoAnimationSettings(validation.data),
      5000,
      "Update logo animation settings",
    ),
  );

  if (result.isErr()) {
      return next(result.error);
  }

  // CHUNK 5: Clear cache when settings change
  await unifiedCache.delete("logo-animation-settings");
  return res.json(result.value);
});

export default router;
