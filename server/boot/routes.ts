import { readFile } from "node:fs/promises";
import type { Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import { logger } from "../lib/monitoring/logger.js";
import { createSsrHandler } from "../lib/ssr/ssr-handler.js";
import { registerRoutes } from "../routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupRoutes(app: Express, httpServer: Server) {
  // API Routes
  console.log("👉 [Boot] Starting registerRoutes...");
  await registerRoutes(app);
  console.log("👉 [Boot] Finished registerRoutes");

  // Prometheus Metrics Endpoint
  const metricsRouter = (await import("../routes/metrics.js")).default;
  app.use("/metrics", metricsRouter);

  // API Documentation UI
  const { default: docsRouter } = await import("../routes/docs.js");
  app.use("/docs", docsRouter);

  // API Documentation
  app.get("/api-docs", async (_req, res) => {
    try {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "public, max-age=3600");
      const specPath = path.resolve(__dirname, "../../openapi-spec.json");
      const spec = JSON.parse(await readFile(specPath, "utf-8"));
      res.json(spec);
    } catch (err) {
      logger.error("[API Docs] Failed to load OpenAPI spec:", err);
      res.status(500).json({ error: "Failed to load API documentation" });
    }
  });

  // P1 SECURITY: Block crawling of Admin/API routes
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /api/\nDisallow: /admin/\nDisallow: /auth/");
  });

  // SSR Configuration (Must be last before error handling)
  // Dev: Vite HMR / Prod: Remix SSR
  try {
    logger.info("[Startup] Initializing SSR Handler...");
    const ssrHandler = await createSsrHandler(app, httpServer);

    // P3 PERFORMANCE: Add edge caching for public SSR pages
    const { ssrCacheMiddleware } = await import("../middleware/ssr-cache.js");
    app.use(ssrCacheMiddleware);

    app.use(ssrHandler);
    logger.info("[Startup] SSR Handler mounted successfully with edge caching.");

    // Fallback 404 handler - catches everything not handled by API or SSR
    // Critical for test mode where SSR is skipped
    app.use((req, res) => {
      if (req.path.startsWith("/api/") || process.env.NODE_ENV === "test") {
        res.status(404).json({
          success: false,
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "The requested resource was not found",
          },
        });
      } else {
        // In production without SSR matching, just send 404 string
        res.status(404).send("Not Found");
      }
    });
  } catch (error) {
    logger.error("Failed to initialize SSR Handler:", error);
    // In dev, this is fatal. In prod, we might want to fail hard too as FE won't load.
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
}
