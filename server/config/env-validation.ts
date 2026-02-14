/**
 * Environment Variable Validation
 * SEC-002: Crash fast on missing or weak secrets at server boot.
 *
 * Must be called BEFORE any middleware/routes are initialized.
 * In production, enforces strong secret requirements.
 * In development, allows weaker defaults but still requires all keys.
 */

import { z } from "zod";
import { logger } from "../lib/monitoring/logger.js";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Session security
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),

  // JWT - reject known weak patterns in production
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Data Encryption
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // Admin config
  INITIAL_ADMIN_EMAIL: z.string().email("INITIAL_ADMIN_EMAIL must be a valid email"),

  // Server config (optional with defaults)
  PORT: z.coerce.number().default(5002),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validates all required environment variables at startup.
 * Exits the process with code 1 if validation fails.
 */
export function validateEnv(): ValidatedEnv {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error("❌ Environment validation failed:");
    for (const issue of result.error.issues) {
      logger.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    logger.error("Fix the above environment variables and restart the server.");
    process.exit(1);
  }

  // Additional production-only checks
  if (result.data.NODE_ENV === "production") {
    if (result.data.JWT_SECRET.includes("dev-secret")) {
      logger.error("❌ JWT_SECRET contains 'dev-secret' — not allowed in production");
      process.exit(1);
    }
    if (result.data.SESSION_SECRET.length < 48) {
      logger.warn("⚠️ SESSION_SECRET is short for production (recommended: 48+ chars)");
    }

    // SEC-F02: Critical Mock Admin Check
    if (process.env.ENABLE_MOCK_ADMIN === "true") {
      logger.error(
        "❌ FATAL: ENABLE_MOCK_ADMIN is set to 'true' in PRODUCTION. This is a critical security violation.",
      );
      logger.error(
        "❌ Server refused to start. Disable MOCK_ADMIN or switch to development environment.",
      );
      process.exit(1);
    }
  }

  logger.info("✅ Environment validation passed");
  return result.data;
}
