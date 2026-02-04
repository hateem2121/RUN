// IMPORTANT: OTel must be initialized first before any other imports
// to properly instrument Express, HTTP, and Pino
import { startOtel } from "./lib/monitoring/otel.js";

startOtel();

import { createServer } from "node:http";
import express from "express";
import { setupErrorHandling, setupHealthChecks, setupMiddleware } from "./boot/middleware.js";
import { setupRoutes } from "./boot/routes.js";
import { startServices } from "./boot/services.js";
import { getConfig } from "./config/production.js";
import { logger } from "./lib/monitoring/logger.js";
import { setupGracefulShutdown } from "./lib/shutdown-manager.js";

import path from "node:path";

export const app = express();
const config = getConfig();

export let serverReady: Promise<void>;

serverReady = (async () => {
  try {
    // 2. Create HTTP Server (Required for Vite HMR / SSR)
    const httpServer = createServer(app);

    // 2.5. Serve Static Assets (Dev) - Bypass all middleware for performance/stability
    // 2.5. Serve Static Assets (Dev) - Bypass all middleware for performance/stability
    if (process.env.NODE_ENV !== "production") {
      // Fixes ERR_EMPTY_RESPONSE for fonts/icons by serving them before any other logic
      // Note: process.cwd() is the 'server' directory, so we need to go up one level
      app.use(express.static(path.resolve(process.cwd(), "../client/public")));
    }

    // 3. Setup Global Middleware
    setupMiddleware(app);

    // 4. Setup Health Checks (Must be before Routes/SSR to avoid shadowing)
    setupHealthChecks(app);

    // 5. Setup Routes & SSR
    await setupRoutes(app, httpServer);

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
    const port = parseInt(process.env.PORT || "5002", 10);
    httpServer.listen(port, () => {
      const address = httpServer.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      logger.info(`Server running on port ${actualPort}`);
      logger.info(`Environment: ${config.app.environment}`);
      logger.info(`👉 Access via IP: http://127.0.0.1:${actualPort} (Use this instead of localhost)`);
    });

    // 10. Server Configuration
    httpServer.timeout = 120000;
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;

    // 11. Graceful Shutdown (centralized)
    setupGracefulShutdown(httpServer, 30000);
  } catch (error) {
    logger.error("Failed to boot server", error);
    process.exit(1); // Fatal error during startup
  }
})();
