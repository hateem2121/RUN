import {
  insertSustainabilityHeroSchema,
  insertUnifiedSustainabilitySchema,
} from "@run-remix/shared";
import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { sustainabilityService } from "../../services/sustainability.service.js";

/**
 * SUSTAINABILITY RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability unified configuration management.
 * Refactored to "Thin Controller" pattern: delegates business logic to sustainabilityService.
 */
const router = Router();

router.get("/", async (_req, res) => {
  const result = await sustainabilityService.getUnifiedConfig();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/", authService.requireAdmin, async (req, res) => {
  const updateSchema = insertUnifiedSustainabilitySchema.partial();
  const validation = updateSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await sustainabilityService.updateUnifiedConfig(removeUndefined(validation.data));
  return result.match(
    (data) => res.json({ success: true, data: data }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/hero", async (_req, res) => {
  const result = await sustainabilityService.getHero();
  return result.match(
    (data) => res.json(data || null),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/hero", authService.requireAdmin, async (req, res) => {
  const validation = insertSustainabilityHeroSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await sustainabilityService.updateHero(removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
