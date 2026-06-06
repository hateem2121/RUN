import { Router } from "express";
import { insertLogoAnimationSettingsSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { homepageService } from "../../services/homepage.service.js";

/**
 * LOGO SETTINGS RESOURCE ROUTER
 *
 * Handles logo animation settings and UI configuration.
 * Refactored to "Thin Controller" pattern: delegates business logic to homepageService.
 */
const router = Router();

// GET /api/logo-animation-settings
router.get("/logo-animation-settings", async (_req, res) => {
  const startTime = performance.now();
  const result = await homepageService.getLogoAnimationSettings();
  return result.match(
    (data) => {
      res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PATCH /api/admin/logo-animation-settings
router.patch("/admin/logo-animation-settings", authService.requireAdmin, async (req, res) => {
  const validation = insertLogoAnimationSettingsSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid logo settings", { issues: validation.error.issues });
  }

  const result = await homepageService.updateLogoAnimationSettings(
    removeUndefined(validation.data),
  );
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
