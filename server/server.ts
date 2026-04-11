// IMPORTANT: OTel must be initialized first before any other imports
// to properly instrument Express, HTTP, and Pino
import { startOtel } from "./lib/monitoring/otel.js";

startOtel();

import { createServer } from "node:http";
import path from "node:path";
import express from "express";
import { setupErrorHandling, setupHealthChecks, setupMiddleware } from "./boot/middleware.js";
import { setupRoutes } from "./boot/routes.js";
import { startServices } from "./boot/services.js";
import { getConfig } from "./config/production.js";
import { logger } from "./lib/monitoring/logger.js";
import { setupGracefulShutdown } from "./lib/shutdown-manager.js";
// SEC-002: Environment is validated in index.ts before this file is loaded.

export const app = express();

// P1 SECURITY: Configure proxy trust for GCLB/Cloud Run headers
// '1' trusts the first hop (GCLB). 'true' also works for internal VPC trust.
if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  app.set("trust proxy", 1);
}

const config = getConfig();

export const serverReady: Promise<void> = (async () => {
  try {
    // 2. Create HTTP Server (Required for Vite HMR / SSR)
    const httpServer = createServer(app);

    // 2.5. Serve Static Assets (Dev) - Bypass all middleware for performance/stability
    if (process.env.NODE_ENV !== "production") {
      // Fixes ERR_EMPTY_RESPONSE for fonts/icons by serving them before any other logic
      // Note: process.cwd() is the 'server' directory, so we need to go up one level
      app.use(express.static(path.resolve(process.cwd(), "../client/public")));
    }

    // 3. Setup Global Middleware (now async for Passport/session init)
    await setupMiddleware(app);

    // 4. Setup Health Checks (Must be before Routes/SSR to avoid shadowing)
    setupHealthChecks(app);

    // 4.5. Start Server early (Async Bootstrap)
    // Port 5002 is strictly enforced for dev/prod, but can be overridden in tests to avoid EADDRINUSE
    const PORT = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 5002;

    // Only listen if we are not in a test environment, or if specifically forced (integration tests)
    const shouldListen = process.env.NODE_ENV !== "test" || process.env.FORCE_LISTEN === "true";

    if (shouldListen) {
      const server = httpServer.listen(PORT, () => {
        const address = server.address();
        const actualPort = typeof address === "string" ? address : address?.port;
        logger.info(
          `[Startup] HTTP Listener open on port ${actualPort}. Environment: ${config.app.environment}`,
        );
        logger.info("[Startup] Continuing async bootstrap (Routes, SSR, Services)...");
      });
    }

    // 5. Setup Routes & SSR (Async - continues while server is listening)
    await setupRoutes(app, httpServer);

    // 6. Setup Static Serving (Production only, fallback if not handled by Nginx)
    // ... continues ...
    if (config.app.environment === "production" || process.env.NODE_ENV === "production") {
      // Serve static assets from the built client directory
      const staticPath = path.resolve(process.cwd(), "../client/build/client");
      app.use(express.static(staticPath, { index: false }));
      logger.info(`[Production] Serving static assets from: ${staticPath}`);
    }

    // 7. Setup Error Handling (Must be last middleware)
    setupErrorHandling(app);

    // 8. Start Background Services
    await startServices();

    // 10. Server Configuration
    httpServer.timeout = 120000;
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;

    // 11. Graceful Shutdown (centralized)
    setupGracefulShutdown(httpServer, 30000);
  } catch (error) {
    logger.error("Failed to boot server", error);
    console.error("BOOT_ERROR_RAW:", error); // Fallback in case Pino transport itself is broken
    process.exit(1); // Fatal error during startup
  }
})();
