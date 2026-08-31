import { validateManufacturingHeroPartial } from "@run-remix/shared";
import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { publicTier } from "../../middleware/rate-limit-tiers.js";
import { manufacturingService } from "../../services/cms/manufacturing.service.js";
import { authService } from "../../services/system/auth.service.js";

/**
 * MANUFACTURING HERO RESOURCES
 *
 * Dedicated router for Manufacturing Hero management.
 * Refactored to "Thin Controller" pattern: delegates business logic to manufacturingService.
 */
const router = Router();
router.use(publicTier);

// GET /api/manufacturing-hero
router.get("/manufacturing-hero", async (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800");
  } else {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  const result = await manufacturingService.getHero();
  return result.match(
    (data) => res.json(data || null),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PATCH /api/manufacturing-hero
router.patch("/manufacturing-hero", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingHeroPartial(req.body);

  if (!validation.success) {
    throw new ValidationError(validation.error.message || "Validation failed", {
      details: validation.error.details,
    });
  }

  const result = await manufacturingService.updateHero(removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
