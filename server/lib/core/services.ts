/**
 * Service Registration Bootstrap
 *
 * @module services
 * @description Registers all application services with the DI container.
 * This file should be imported early in the application lifecycle.
 *
 * @initialization Import this module in server.ts after OTel initialization:
 * ```typescript
 * import './lib/core/services.js';
 * ```
 */

import { db } from "../../db.js";
import { logger } from "../monitoring/logger.js";
import { container, ServiceTokens } from "./di-container.js";

/**
 * Register core application services
 * Services are registered as singletons by default
 */
export function registerServices(): void {
  // Database
  container.register(ServiceTokens.DATABASE, () => db);

  // Logging
  container.register(ServiceTokens.LOGGER, () => logger);

  // Cache (lazy import to avoid circular dependencies)
  container.register(ServiceTokens.CACHE, () => {
    // Lazy load to break circular dependency
    const { unifiedCache } = require("../cache/unified-cache.js");
    return unifiedCache;
  });

  logger.info("[DI] Core services registered", {
    services: container.getTokens(),
  });
}

// Auto-register on import if not in test mode
if (process.env.NODE_ENV !== "test") {
  registerServices();
}
