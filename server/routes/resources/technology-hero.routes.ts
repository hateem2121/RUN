import { Router } from "express";
import { insertTechnologyHeroSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * TECHNOLOGY HERO RESOURCE ROUTER
 *
 * Modular Express Router for Technology Hero management.
 * Refactored to "Thin Controller" pattern: delegates business logic to technologyService.
 */
const router = Router();

router.get("/", async (_req, res) => {
  const result = await technologyService.getHero();
  if (result.isErr()) throw result.error;

  return res.json(result.value || {});
});

router.patch("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyHeroSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.updateHero(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

export default router;
