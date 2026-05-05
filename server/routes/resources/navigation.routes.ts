/**
 * NAVIGATION ROUTES MODULE
 * Handles public navigation items and settings
 */

import express from "express";
import { z } from "zod";
import {
  insertNavigationGlassmorphismSettingsSchema,
  insertNavigationItemSchema,
} from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";
import { NavigationService } from "../../services/navigation-service.js";

const router = express.Router();

// Cache TTL (2 hours for navigation data)

/**
 * CHUNK 7: Admin Cache Bypass Utility
 */
function shouldBypassCache(req: express.Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

/**
 * GET /navigation-items
 * Returns all active navigation items ordered by sort order
 */
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
  if (bypassCache) {
    res.setHeader("X-Admin-Request", "true");
  }

  return res.json(data.data);
});

/**
 * GET /navigation-settings
 * Returns navigation-specific UI settings (glassmorphism, etc.)
 */
router.get("/navigation-settings", async (_req, res, next) => {
  const result = await NavigationService.getGlassmorphismSettings();

  if (result.isErr()) {
    return next(result.error);
  }
  return res.json(result.value);
});

// ============================================================================
// ADMIN NAVIGATION ROUTES
// ============================================================================

// Create navigation item
router.post("/admin/navigation-items", authService.requireAdmin, async (req, res, next) => {
  const validatedData = insertNavigationItemSchema.safeParse(req.body);
  if (!validatedData.success) {
    return next(
      new ValidationError("Invalid navigation item", { issues: validatedData.error.issues }),
    );
  }

  const result = await NavigationService.createItem(validatedData.data);

  if (result.isErr()) {
    return next(result.error);
  }

  return res.status(201).json(result.value);
});

// Bulk reorder navigation items
router.patch(
  "/admin/navigation-items/reorder",
  authService.requireAdmin,
  async (req, res, next) => {
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
  },
);

// Update navigation item
router.patch("/admin/navigation-items/:id", authService.requireAdmin, async (req, res, next) => {
  const id = Number.parseInt(req.params.id as string, 10);
  const validatedData = insertNavigationItemSchema.partial().safeParse(req.body);

  if (!validatedData.success) {
    return next(new ValidationError("Invalid update data", { issues: validatedData.error.issues }));
  }

  const result = await NavigationService.updateItem(
    id,
    validatedData.data as Record<string, unknown>,
  );

  if (result.isErr()) {
    return next(result.error);
  }
  return res.json(result.value);
});

// Delete navigation item
router.delete("/admin/navigation-items/:id", authService.requireAdmin, async (req, res, next) => {
  const id = Number.parseInt(req.params.id as string, 10);
  const result = await NavigationService.deleteItem(id);

  if (result.isErr()) {
    return next(result.error);
  }
  return res.status(204).send();
});

// Update glassmorphism settings
router.patch(
  "/admin/navigation-glassmorphism-settings",
  authService.requireAdmin,
  async (req, res, next) => {
    const validation = insertNavigationGlassmorphismSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return next(
        new ValidationError("Invalid glassmorphism settings", { issues: validation.error.issues }),
      );
    }
    const result = await NavigationService.updateGlassmorphismSettings(
      validation.data as Record<string, unknown>,
    );

    if (result.isErr()) {
      return next(result.error);
    }
    return res.json(result.value);
  },
);

logger.debug("[Navigation Routes] ✅ Navigation routes loaded");

export default router;
