import { insertTechnologyCtaSchema } from "@run-remix/shared";
import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * TECHNOLOGY CTA RESOURCE ROUTER
 *
 * Modular Express Router for Technology Call-to-Action management.
 * Refactored to "Thin Controller" pattern: delegates business logic to technologyService.
 */
const router = Router();

router.get("/", async (_req, res) => {
  const result = await technologyService.getCta();
  return result.match(
    (data) => res.json(data || null),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyCtaSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.updateCta(removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
