import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { manufacturingService } from "../../services/manufacturing.service.js";
import { validateManufacturingHeroPartial } from "../../validation/manufacturing.js";

/**
 * MANUFACTURING HERO RESOURCES
 *
 * Dedicated router for Manufacturing Hero management.
 * Refactored to "Thin Controller" pattern: delegates business logic to manufacturingService.
 */
const router = Router();

// GET /api/manufacturing-hero
router.get("/manufacturing-hero", async (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800");
  } else {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  const result = await manufacturingService.getHero();
  if (result.isErr()) throw result.error;

  return res.json(result.value || null);
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
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

export default router;
