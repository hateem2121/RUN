import { Router } from "express";
import { z } from "zod";
import {
  insertTechnologyGradientSettingsSchema,
  technologyGradientFrontendSchema,
} from "../../../shared/index.js";
import { jsonResponse, registry } from "../../lib/api/openapi-generator.js";
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

registry.registerPath({
  method: "get",
  path: "/resources/technology-gradient-settings",
  summary: "Get technology page gradient settings",
  tags: ["Resources"],
  responses: {
    200: jsonResponse(z.any(), "Gradient settings data"),
  },
});
router.get("/", async (_req, res) => {
  const result = await technologyService.getGradientSettings();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

registry.registerPath({
  method: "patch",
  path: "/resources/technology-gradient-settings",
  summary: "Update technology page gradient settings",
  tags: ["Resources"],
  security: [{ sessionAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.lazy(() => z.any()), // Use z.any() or specific schema if available
        },
      },
    },
  },
  responses: {
    200: jsonResponse(z.any(), "Updated gradient settings"),
  },
});
router.patch("/", authService.requireAdmin, async (req, res) => {
  let storageData: Record<string, unknown> = {};

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
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
