/**
 * LOGO SETTINGS ROUTES MODULE
 * Handles logo animation settings and UI configuration
 */

import express from "express";
import { insertLogoAnimationSettingsSchema } from "../../../shared/schema.js";
import { safeQuery } from "../../db.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { ValidationError } from "../../lib/errors.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";

const router = express.Router();

// Cache TTL constant (in seconds)
const CACHE_TTL_STATIC = 10800; // 3 hours

// Get logo animation settings
router.get("/logo-animation-settings", async (_req, res, next) => {
  const cacheKey = "logo-animation-settings";
  const cached = await unifiedCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const result = await safeQuery(
    withTimeout(getStorage().getLogoAnimationSettings(), 5000, "Get logo animation settings"),
  );

  if (result.isErr()) {
    return next(result.error);
  }

  const settings = result.value || {};
  await unifiedCache.set(cacheKey, settings, CACHE_TTL_STATIC * 1000);
  return res.json(settings);
});

// Update logo animation settings
router.patch("/admin/logo-animation-settings", authService.requireAdmin, async (req, res, next) => {
  const validation = insertLogoAnimationSettingsSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError("Invalid logo settings", { issues: validation.error.issues }));
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

  // Clear cache when settings change
  await unifiedCache.delete("logo-animation-settings");
  return res.json(result.value);
});

export default router;
