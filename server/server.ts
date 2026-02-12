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
import { validateEnv } from "./config/env-validation.js";
import { getConfig } from "./config/production.js";
import { logger } from "./lib/monitoring/logger.js";
import { setupGracefulShutdown } from "./lib/shutdown-manager.js";

// SEC-002: Validate environment variables before any initialization
validateEnv();

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

    // 3. Setup Global Middleware (now async for Passport/session init)
    await setupMiddleware(app);

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
    // 8. Start Background Services
    // Removed duplicate call here as it is called below with logs

    // 9. Start Server
    await startServices();

    // 9. Start Server
    // 9. Start Server
    // PORT 5002 is strictly enforced for dev/prod, but can be overridden in tests to avoid EADDRINUSE
    const PORT =
      (process.env.NODE_ENV === "test" || process.env.VITEST === "true") &&
      process.env.PORT !== undefined
        ? parseInt(process.env.PORT, 10)
        : 5002;

    // Only listen if we are not in a test environment, or if specifically forced (integration tests)
    const shouldListen = process.env.NODE_ENV !== "test" || process.env.FORCE_LISTEN === "true";

    if (shouldListen) {
      httpServer.listen(PORT, () => {
        const address = httpServer.address();
        const _actualPort = typeof address === "string" ? PORT : address?.port || PORT;
        logger.info(`Environment: ${config.app.environment}`);
      });
    }

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
