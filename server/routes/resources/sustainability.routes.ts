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
  if (result.isErr()) throw result.error;

  return res.json(result.value);
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
  if (result.isErr()) throw result.error;

  return res.json({
    success: true,
    data: result.value,
  });
});

router.get("/hero", async (_req, res) => {
  const result = await sustainabilityService.getHero();
  if (result.isErr()) throw result.error;

  return res.json(result.value || null);
});

router.patch("/hero", authService.requireAdmin, async (req, res) => {
  const validation = insertSustainabilityHeroSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await sustainabilityService.updateHero(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

export default router;
