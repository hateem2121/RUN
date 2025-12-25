import { z } from "zod";
import { logger } from "../lib/smart-logger.js";

/**
 * Environment Variable Validation Schema
 * Enforces strict presence of critical configuration to prevent runtime crashes.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Security
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  // Optional but recommended for observability
  // We don't fail hard on this to keep "Totally Free" flexibility if user disables it
  GLITCHTIP_DSN: z.string().optional(),

  // App
  PORT: z.string().optional().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);

    // Assign defaults back to process.env if needed, though usually just validation is enough
    if (!process.env.PORT) process.env.PORT = parsed.PORT;
    if (!process.env.NODE_ENV) process.env.NODE_ENV = parsed.NODE_ENV;

    logger.info("[Config] ✅ Environment variables validated successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((_issue) => {});
      process.exit(1);
    }
  }
}
