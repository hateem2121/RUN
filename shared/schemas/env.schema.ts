import { z } from "zod";

/**
 * MASTER ENVIRONMENT SCHEMA
 * Centralized source of truth for all RUN Remix environment variables.
 * Enforces B.L.A.S.T. protocol security and system invariants.
 */
export const envSchema = z.object({
  // --- NODE.JS ENVIRONMENT ---
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z
    .string()
    .default("5002") // RULE 1: Port 5002 is mandatory for production
    .transform((val) => parseInt(val, 10))
    .refine((port) => port === 5002 || port === 0, "PORT must be 5002 (or 0 for dynamic testing)"),
  DEV: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  npm_package_version: z.string().optional().default("1.0.0"),

  // --- DATABASE CONFIGURATION ---
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  DIRECT_DATABASE_URL: z
    .string()
    .optional()
    .describe("Direct (non-pooled) database URL for LISTEN/NOTIFY"),
  DATABASE_SSL_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  DATABASE_SSL_CA: z.string().optional(),

  // --- AUTHENTICATION & SECURITY ---
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Admin & API Keys
  INITIAL_ADMIN_EMAIL: z.string().email("INITIAL_ADMIN_EMAIL must be a valid email"),
  ENABLE_MOCK_ADMIN: z.enum(["true", "false"]).default("false"),
  ADMIN_API_KEY: z.string().optional(),
  ENTERPRISE_API_KEY: z.string().optional(),
  MIGRATION_API_KEY: z.string().optional(),

  // --- NETWORKING ---
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  CORS_ALLOW_CREDENTIALS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  RATE_LIMIT_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),

  // --- STORAGE & CDN ---
  GCS_BUCKET_NAME: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_CLOUD_LOCATION: z.string().default("us-central1"),
  OBJECT_STORAGE_CDN_DOMAIN: z.string().optional(),
  ENABLE_CDN_PARTITIONING: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  PUBLIC_ASSET_PARTITION: z.string().default("public"),
  PRIVATE_ASSET_PARTITION: z.string().default("private"),
  THUMBNAIL_CACHE_ENABLED: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // --- 3D PRODUCT VISUALIZATION ---
  GLTF_CACHE_DURATION: z
    .string()
    .default("31536000")
    .transform((val) => parseInt(val, 10)),
  MODEL_VIEWER_CDN_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  MODEL_VIEWER_PRELOAD_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),

  // --- OBSERVABILITY ---
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  ENABLE_DEBUG_LOGS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // OpenTelemetry (System Invariant)
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional().default("http://localhost:4318"),
  OTEL_SERVICE_NAME: z.string().optional().default("run-remix"),

  // --- CACHING & QUEUES ---
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ENABLE_CACHE_WARMING: z
    .string()
    .default("true")
    .transform((val) => val === "true"),

  // --- TESTING ---
  VITEST: z
    .string()
    .optional()
    .describe("Set to 'true' in Vitest to bypass certain production checks"),
  FORCE_LISTEN: z
    .string()
    .optional()
    .describe("Set to 'true' to allow LISTEN/NOTIFY without direct URL in tests"),
  BYPASS_RBAC_FOR_TESTING: z
    .string()
    .default("false")
    .transform((val) => val === "true")
    .describe("Set to 'true' to bypass RBAC checks locally"),

  // --- CLOUD TASKS (OIDC) ---
  CLOUD_TASKS_AUDIENCE: z.string().optional(),
  CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates the environment and crashes fast if requirements aren't met.
 */
export function validateEnv(input: unknown = process.env): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  const data = result.data;

  // Additional Production Hardening
  if (data.NODE_ENV === "production" && data.VITEST !== "true") {
    // SEC-F02: Mock Admin Sanity Check
    if (data.ENABLE_MOCK_ADMIN === "true") {
      console.error("❌ FATAL: ENABLE_MOCK_ADMIN is 'true' in PRODUCTION. Refusing to boot.");
      process.exit(1);
    }

    // SESSION_SECRET length warning
    if (data.SESSION_SECRET.length < 48) {
      console.warn("⚠️ SESSION_SECRET is shorter than recommended (48+) for production.");
    }

    if (data.BYPASS_RBAC_FOR_TESTING) {
      console.error("❌ FATAL: BYPASS_RBAC_FOR_TESTING is 'true' in PRODUCTION.");
      process.exit(1);
    }

    if (!data.CLOUD_TASKS_AUDIENCE || !data.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL) {
      console.error(
        "❌ FATAL: CLOUD_TASKS_AUDIENCE and CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL are required in production for worker security.",
      );
      process.exit(1);
    }
  }

  return data;
}
