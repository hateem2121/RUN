import { Router } from "express";
import {
  insertTechnologyGradientSettingsSchema,
  technologyGradientFrontendSchema,
} from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * TECHNOLOGY GRADIENT SETTINGS RESOURCE ROUTER
 *
 * Modular Express Router for Technology Gradient Settings management.
 * Refactored to "Thin Controller" pattern: delegates business logic to technologyService.
 */
const router = Router();

router.get("/", async (_req, res) => {
  const result = await technologyService.getGradientSettings();
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.patch("/", authService.requireAdmin, async (req, res) => {
  let storageData: any = {};

  // Detect format and validate
  const frontendValidation = technologyGradientFrontendSchema.safeParse(req.body);
  if (frontendValidation.success) {
    storageData = technologyService.transformFrontendGradient(frontendValidation.data);
  } else {
    const dbValidation = insertTechnologyGradientSettingsSchema.partial().safeParse(req.body);
    if (!dbValidation.success) {
      throw new ValidationError("Invalid request format", {
        details: "Request matches neither frontend structure nor database schema",
      });
    }
    storageData = dbValidation.data;
  }

  const result = await technologyService.updateGradientSettings(removeUndefined(storageData));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

export default router;
