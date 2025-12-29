import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiSpec } from "../lib/openapi-generator.js";

const router = Router();

// Route to get the JSON spec directly
router.get("/openapi.json", (_req, res) => {
  try {
    const spec = generateOpenApiSpec();
    res.json(spec);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Serve Swagger UI
const spec = generateOpenApiSpec();
router.use("/", swaggerUi.serve, swaggerUi.setup(spec));

export default router;
