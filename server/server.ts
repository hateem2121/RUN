import { createServer } from "node:http";
import express from "express";
import { setupErrorHandling, setupHealthChecks, setupMiddleware } from "./boot/middleware.js";
import { setupRoutes } from "./boot/routes.js";
import { startServices } from "./boot/services.js";
import { getConfig } from "./config/production.js";
import { logger } from "./lib/monitoring/logger.js";

const app = express();
const config = getConfig();

const _BOOT_TIMEOUT = 30000; // 30s boot timeout

(async () => {
  try {
    // 2. Create HTTP Server (Required for Vite HMR / SSR)
    const httpServer = createServer(app);

    // 3. Setup Global Middleware
    setupMiddleware(app);

    // 4. Setup Routes & SSR
    await setupRoutes(app, httpServer);

    // 5. Setup Health Checks
    setupHealthChecks(app);

    // 6. Setup Static Serving (Production only, fallback if not handled by Nginx)
    // Runs before error handlers but after API routes
    if (config.app.environment === "production" || process.env["NODE_ENV"] === "production") {
      // In production, assets should be served via CDN (GCS/Cloud CDN).
      // We only serve favicon/robots here if absolutely necessary, but generally disable static serving
      // to reduce Node.js load.
      // app.use(express.static(path.resolve(process.cwd(), "dist/public"), { index: false }));
    }

    // 7. Setup Error Handling (Must be last middleware)
    setupErrorHandling(app);

    // 8. Start Background Services
    await startServices();

    // 9. Start Server
    const port = parseInt(process.env["PORT"] || "5001", 10);
    httpServer.listen(port, "0.0.0.0", () => {
      const address = httpServer.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      logger.info(`Server running on port ${actualPort}`);
      logger.info(`Environment: ${config.app.environment}`);
    });

    // 10. Server Configuration
    httpServer.timeout = 120000;
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;

    // 11. Graceful Shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`[${signal}] Shutting down...`);
      httpServer.close(() => {
        logger.info(`[${signal}] Server closed`);
        process.exit(0);
      });
      setTimeout(() => {
        logger.error(`[${signal}] Force shutdown after timeout`);
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to boot server", error);
    process.exit(1); // Fatal error during startup
  }
})();
