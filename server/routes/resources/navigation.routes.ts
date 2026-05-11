import { Router } from "express";
import {
  insertNavigationGlassmorphismSettingsSchema,
  insertNavigationItemSchema,
  navigationReorderSchema,
} from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { NavigationService } from "../../services/navigation-service.js";

/**
 * NAVIGATION RESOURCE ROUTER
 *
 * Handles public navigation items and settings.
 * Refactored for Express 5.2 compliance: uses native error propagation (throw).
 * Aligned with "Thin Controller" pattern.
 */
const router = Router();

/**
 * GET /navigation-items
 * Returns all active navigation items ordered by sort order
 */
router.get("/navigation-items", async (req, res) => {
  const bypassCache = shouldBypassCache(req);
  const result = await NavigationService.getItems(bypassCache);

  if (result.isErr()) throw result.error;

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
router.get("/navigation-settings", async (_req, res) => {
  const startTime = performance.now();
  const result = await NavigationService.getGlassmorphismSettings();

  if (result.isErr()) throw result.error;
  
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  return res.json(result.value);
});

// ============================================================================
// ADMIN NAVIGATION ROUTES
// ============================================================================

// Create navigation item
router.post("/admin/navigation-items", authService.requireAdmin, async (req, res) => {
  const validatedData = insertNavigationItemSchema.safeParse(req.body);
  if (!validatedData.success) {
    throw new ValidationError("Invalid navigation item", { issues: validatedData.error.issues });
  }

  const result = await NavigationService.createItem(validatedData.data);
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

// Bulk reorder navigation items
router.patch("/admin/navigation-items/reorder", authService.requireAdmin, async (req, res) => {
  const { items } = req.body;
  const validation = navigationReorderSchema.safeParse({ items });

  if (!validation.success) {
    throw new ValidationError("Invalid reorder data", { issues: validation.error.issues });
  }

  const result = await NavigationService.reorderItems(validation.data.items);
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

// Update navigation item
router.patch("/admin/navigation-items/:id", authService.requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id as string, 10);
  const validatedData = insertNavigationItemSchema.partial().safeParse(req.body);

  if (!validatedData.success) {
    throw new ValidationError("Invalid update data", { issues: validatedData.error.issues });
  }

  const result = await NavigationService.updateItem(
    id,
    validatedData.data as Record<string, unknown>,
  );

  if (result.isErr()) throw result.error;
  return res.json(result.value);
});

// Delete navigation item
router.delete("/admin/navigation-items/:id", authService.requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id as string, 10);
  const result = await NavigationService.deleteItem(id);

  if (result.isErr()) throw result.error;
  return res.status(204).send();
});

// Update glassmorphism settings
router.patch(
  "/admin/navigation-glassmorphism-settings",
  authService.requireAdmin,
  async (req, res) => {
    const validation = insertNavigationGlassmorphismSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid glassmorphism settings", {
        issues: validation.error.issues,
      });
    }

    const result = await NavigationService.updateGlassmorphismSettings(
      validation.data as Record<string, unknown>,
    );

    if (result.isErr()) throw result.error;
    return res.json(result.value);
  },
);

export default router;
