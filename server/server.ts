import { createServer } from "node:http";
import express from "express";
import { setupErrorHandling, setupHealthChecks, setupMiddleware } from "./boot/middleware.js";
import { setupRoutes } from "./boot/routes.js";
import { startServices } from "./boot/services.js";
import { getConfig } from "./config/production.js";
import { logger } from "./lib/monitoring/logger.js";

export const app = express();
const config = getConfig();

export let serverReady: Promise<void>;

serverReady = (async () => {
  try {
    console.log("[Server] Starting server initialization...");

    // 2. Create HTTP Server (Required for Vite HMR / SSR)
    const httpServer = createServer(app);
    console.log("[Server] HTTP server created");

    // 3. Setup Global Middleware
    setupMiddleware(app);
    console.log("[Server] Middleware setup complete");

    // 4. Setup Routes & SSR
    await setupRoutes(app, httpServer);
    console.log("[Server] Routes setup complete");

    // 5. Setup Health Checks
    setupHealthChecks(app);
    console.log("[Server] Health checks setup complete");

    // 6. Setup Static Serving (Production only, fallback if not handled by Nginx)
    // Runs before error handlers but after API routes
    if (config.app.environment === "production" || process.env.NODE_ENV === "production") {
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
    const port = parseInt(process.env.PORT || "5001", 10);
    httpServer.listen(port, "0.0.0.0", () => {
      const address = httpServer.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      // Plain console.log for integration test detection
      console.log(`Server running on port ${actualPort}`);
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
