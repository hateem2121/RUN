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
import { logger } from "../lib/smart-logger.js";

/**
 * Create CORS middleware with environment-based configuration
 *
 * Production: Strict origin whitelisting
 * Development: Permissive for local development
 */
export function createCorsMiddleware() {
	const config = getConfig();
	const { origins, credentials } = config.security.cors;

	const corsOptions: CorsOptions = {
		origin: (origin, callback) => {
			// Allow requests with no origin (mobile apps, curl, postman)
			if (!origin) {
				return callback(null, true);
			}

			// Development: Allow all origins
			if (config.app.environment === "development") {
				logger.debug(`[CORS] Development mode - allowing origin: ${origin}`);
				return callback(null, true);
			}

			// Production/Staging: Strict origin validation
			const isAllowed = origins.some((allowedOrigin) => {
				// Handle wildcard patterns (e.g., "https://*.repl.co")
				if (allowedOrigin.includes("*")) {
					const pattern = allowedOrigin
						.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
						.replace(/\*/g, ".*");
					const regex = new RegExp(`^${pattern}$`);
					return regex.test(origin);
				}
				// Exact match
				return origin === allowedOrigin;
			});

			if (isAllowed) {
				logger.debug(`[CORS] Origin allowed: ${origin}`);
				callback(null, true);
			} else {
				logger.warn(`[CORS] ⚠️ Origin blocked: ${origin}`, {
					allowedOrigins: origins,
					environment: config.app.environment,
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
		],
		exposedHeaders: ["X-Correlation-ID"],
		maxAge: 86400, // 24 hours - preflight cache
	};

	logger.info(
		`[CORS] Middleware initialized for ${config.app.environment} environment`,
		{
			allowedOrigins: origins,
			credentials,
		},
	);

	return cors(corsOptions);
}
