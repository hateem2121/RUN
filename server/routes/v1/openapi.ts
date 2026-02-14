import { Router } from "express";
import { generateOpenApiSpec } from "../../lib/api/openapi-generator.js";

const router = Router();

/**
 * GET /api-docs.json
 *
 * Serves the raw OpenAPI 3.1 JSON specification.
 * This is used by Swagger UI and for SDK generation.
 */
router.get("/openapi.json", (_req, res) => {
  const spec = generateOpenApiSpec();
  res.setHeader("Content-Type", "application/json");
  res.json(spec);
});

export default router;
