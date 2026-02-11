/**
 * CORS CONFIGURATION MIDDLEWARE
 * CHUNK 8: Security Audit - Production CORS Restrictions
 *
 * Enforces strict origin validation based on environment:
 * - Production: Only approved domains (replit.com, custom domains)
 * - Development: Allow all origins for local testing
 */

import type { CorsOptions } from "cors";
import cors from "cors";
import { getConfig } from "../config/production.js";
import { logger } from "../lib/monitoring/logger.js";

/**
 * Create CORS middleware with environment-based configuration
 *
 * Production: Strict origin whitelisting
 * Development: Permissive for local development
 */
export function createCorsMiddleware() {
  const config = getConfig();
  // P1 SECURITY: Allowlist must be explicit in production
  const allowedOriginsEnv = process.env.STRICT_ALLOWED_ORIGINS;
  const explicitOrigins = allowedOriginsEnv ? allowedOriginsEnv.split(",") : [];

  const { origins, credentials } = config.security.cors;
  // Merge config origins with env origins
  const effectiveOrigins = [...origins, ...explicitOrigins];

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // SEC-005: In production, require Origin header for API security
      if (!origin) {
        if (config.app.environment === "production") {
          logger.warn("[CORS] Blocked request with no Origin header in production");
          return callback(new Error("CORS policy: Origin header required"));
        }
        // Allow in development for Postman/curl/mobile
        return callback(null, true);
      }

      // Development: Allow local origins only
      const isLocalHost =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === "http://localhost" ||
        origin === "http://127.0.0.1";

      if (config.app.environment === "development") {
        if (isLocalHost) {
          return callback(null, true);
        }
        logger.warn(`[CORS] Development block: ${origin} is not a local origin`);
        return callback(new Error(`CORS policy: Local development only allows local origins`));
      }

      // Production/Staging: Strict origin validation
      const isAllowed = effectiveOrigins.some((allowedOrigin) => {
        // Handle wildcard patterns (e.g., "https://*.repl.co")
        if (allowedOrigin.includes("*")) {
          const pattern = allowedOrigin.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        // Exact match
        return origin === allowedOrigin;
      });

      if (isAllowed) {
        // logger.debug(`[CORS] Origin allowed: ${origin}`); // Reduce noise
        callback(null, true);
      } else {
        logger.warn(`[CORS] ⚠️ Origin blocked: ${origin}`, {
          allowedOrigins: effectiveOrigins,
        });
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials, // Allow credentials (cookies, auth headers)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Correlation-ID",
      "x-csrf-token",
      "Sentry-Trace",
      "Baggage",
    ],
    exposedHeaders: ["X-Correlation-ID"],
    maxAge: 86400, // 24 hours - preflight cache
  };

  logger.info(`[CORS] Middleware initialized for ${config.app.environment}`, {
    effectiveOrigins,
  });

  return cors(corsOptions);
}
