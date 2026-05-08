import { Router } from "express";
import { insertAboutHeroSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

/**
 * ABOUT HERO RESOURCE ROUTER
 *
 * Modular Express Router for About Hero management.
 * Refactored to "Thin Controller" pattern: delegates business logic to aboutService.
 * Enforces RFC 9110/9457 compliance via native Express 5 error propagation.
 */
const router = Router();

/**
 * GET /api/about-hero
 * Retrieve the About page hero section
 */
router.get("/", async (_req, res) => {
  const result = await aboutService.getHero();
  if (result.isErr()) throw result.error;

  return res.json(result.value || null);
});

/**
 * PATCH /api/about-hero
 * Update the About page hero section
 */
router.patch("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutHeroSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", { issues: validation.error.issues });
  }

  const result = await aboutService.updateHero(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

export default router;
