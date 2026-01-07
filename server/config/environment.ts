/**
 * CENTRALIZED ENVIRONMENT CONFIGURATION
 * Single source of truth for all environment variables
 * Provides validation, type safety, and standardized access
 */

import "dotenv/config";
import { z } from "zod";

// Environment validation schema
const environmentSchema = z.object({
  // Node.js Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z
    .string()
    .default("5000")
    .transform((val) => parseInt(val, 10)),

  // Database Configuration
  DATABASE_URL: z.string().default("postgres://localhost:5432/test"),
  DATABASE_SSL_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .describe("Enable SSL for database connections"),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .describe("Verify SSL certificates (secure by default)"),
  DATABASE_SSL_CA: z.string().optional().describe("Custom SSL CA certificate"),

  // Google Cloud Configuration
  // Google Cloud Configuration
  GCS_BUCKET_NAME: z.string().optional().describe("Google Cloud Storage bucket name"),
  GOOGLE_CLIENT_ID: z.string().optional().describe("Google OAuth Client ID"),
  GOOGLE_CLIENT_SECRET: z.string().optional().describe("Google OAuth Client Secret"),
  GOOGLE_CLOUD_PROJECT: z.string().optional().describe("Google Cloud Project ID"),
  GOOGLE_CLOUD_LOCATION: z.string().default("us-central1").describe("Google Cloud Location"),
  RECAPTCHA_SECRET_KEY: z.string().optional().describe("reCAPTCHA v3 Secret Key"),

  // Performance & Monitoring
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  SENTRY_DSN: z.string().optional().describe("Sentry DSN for error tracking"),
  SENTRY_ENVIRONMENT: z.string().optional().describe("Sentry environment tag"),
  SENTRY_REPORT_URI: z.string().optional().describe("Sentry Report URI for CSP violations"),

  // Security Configuration
  CORS_ALLOWED_ORIGINS: z
    .string()
    .optional()
    .describe("Comma-separated list of allowed CORS origins"),
  CORS_ALLOW_CREDENTIALS: z
    .string()
    .default("false")
    .transform((val) => val === "true")
    .describe("Allow CORS credentials"),
  RATE_LIMIT_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  ADMIN_API_KEY: z.string().optional().describe("Admin API key for management endpoints"),
  ENTERPRISE_API_KEY: z.string().optional().describe("Enterprise API key for advanced features"),
  MIGRATION_API_KEY: z.string().optional().describe("Migration API key for data operations"),
  SESSION_SECRET: z
    .string()
    .default("test-secret-default")
    .describe("Session secret for Express sessions"),
  INITIAL_ADMIN_EMAIL: z.string().optional().describe("Email of the initial admin user"),

  // Development Environment
  DEV: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .describe("Development mode flag"),
  npm_package_version: z.string().optional().describe("Package version from npm"),

  // Feature Flags
  ENABLE_DEBUG_LOGS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  ENABLE_CACHE_WARMING: z
    .string()
    .default("true")
    .transform((val) => val === "true"),

  // 3D Model & CDN Configuration
  GLTF_CACHE_DURATION: z
    .string()
    .default("31536000")
    .transform((val) => parseInt(val, 10))
    .describe("Cache duration for GLTF/GLB files in seconds"),
  MODEL_VIEWER_CDN_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .describe("Enable CDN optimization for 3D models"),
  MODEL_VIEWER_PRELOAD_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .describe("Enable 3D model preloading"),
  OBJECT_STORAGE_CDN_DOMAIN: z
    .string()
    .optional()
    .describe("Custom CDN domain for object storage assets"),

  // Object Storage Partition Configuration (CDN-ready structure)
  PUBLIC_ASSET_PARTITION: z
    .string()
    .default("public")
    .describe("Root partition for public, CDN-cacheable assets"),
  PRIVATE_ASSET_PARTITION: z
    .string()
    .default("private")
    .describe("Root partition for private, access-controlled assets"),
  ENABLE_CDN_PARTITIONING: z
    .string()
    .default("true")
    .transform((val) => val === "true")
    .describe("Enable public/private asset partitioning for CDN optimization"),
  THUMBNAIL_CACHE_ENABLED: z
    .string()
    .default("false")
    .transform((val) => val === "true")
    .describe("Enable persistent thumbnail caching (vs dynamic generation)"),
});

// Parse and validate environment
const parseEnvironment = () => {
  try {
    const result = environmentSchema.parse(process.env);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];

      const missingVars = issues
        .filter((err) => err.code === "invalid_type" && (err as any).received === "undefined")
        .map((err) => err.path.join("."));

      const invalidVars = issues
        .filter((err) => err.code !== "invalid_type" || (err as any).received !== "undefined")
        .map((err) => `${err.path.join(".")}: ${err.message}`);

      let errorMessage = "❌ Environment Configuration Error:\n";

      if (missingVars.length > 0) {
        errorMessage += `\n🔴 Missing required environment variables:\n${missingVars
          .map((v) => `  - ${v}`)
          .join("\n")}\n`;
      }

      if (invalidVars.length > 0) {
        errorMessage += `\n🟡 Invalid environment variables:\n${invalidVars
          .map((v) => `  - ${v}`)
          .join("\n")}\n`;
      }

      // If we have issues but couldn't categorize them, print the raw issues
      if (missingVars.length === 0 && invalidVars.length === 0 && issues.length > 0) {
        errorMessage += `\nValidation issues:\n${JSON.stringify(issues, null, 2)}\n`;
      }
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Validated environment configuration
export let env: any;
try {
  env = parseEnvironment();
} catch (e) {
  throw e;
}

// Environment utilities
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Database configuration with secure SSL defaults
export const database = {
  url: env.DATABASE_URL,
  ssl: env.DATABASE_SSL_ENABLED
    ? {
        rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
        ca: env.DATABASE_SSL_CA || undefined,
      }
    : false,
} as const;

// CORS origin allowlist builder
const corsOrigins: string[] = (() => {
  if (env.CORS_ALLOWED_ORIGINS === "*") return ["*"];
  if (!env.CORS_ALLOWED_ORIGINS) return [];
  return env.CORS_ALLOWED_ORIGINS.split(",").map((origin: string) => origin.trim());
})();

// Server configuration with secure CORS
export const server = {
  port: env.PORT,
  corsOrigin: corsOrigins,
  corsCredentials: env.CORS_ALLOW_CREDENTIALS,
  rateLimitEnabled: env.RATE_LIMIT_ENABLED,
} as const;

// Logging configuration
export const logging = {
  level: env.LOG_LEVEL,
  enableDebug: env.ENABLE_DEBUG_LOGS || isDevelopment,
  enablePerformanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING,
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
  },
} as const;

// Security configuration
export const security = {
  adminApiKey: env.ADMIN_API_KEY,
  enterpriseApiKey: env.ENTERPRISE_API_KEY,
  migrationApiKey: env.MIGRATION_API_KEY,
  sessionSecret: env.SESSION_SECRET,
  initialAdminEmail: env.INITIAL_ADMIN_EMAIL,
  recaptchaSecret: env.RECAPTCHA_SECRET_KEY,
} as const;

// Cloud configuration
export const cloud = {
  project: env.GOOGLE_CLOUD_PROJECT,
  location: env.GOOGLE_CLOUD_LOCATION,
  bucket: env.GCS_BUCKET_NAME,
} as const;

// Development configuration
export const development = {
  isDev: env.DEV || isDevelopment,
  packageVersion: env.npm_package_version || "1.0.0",
} as const;

// Feature flags
export const features = {
  cacheWarming: env.ENABLE_CACHE_WARMING,
  debugLogs: env.ENABLE_DEBUG_LOGS || isDevelopment,
  performanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING,
} as const;

// CDN & Object Storage Configuration
export const cdn = {
  domain: env.OBJECT_STORAGE_CDN_DOMAIN,
  enabled: !!env.OBJECT_STORAGE_CDN_DOMAIN,
  partitioning: {
    enabled: env.ENABLE_CDN_PARTITIONING,
    publicPartition: env.PUBLIC_ASSET_PARTITION,
    privatePartition: env.PRIVATE_ASSET_PARTITION,
  },
  thumbnails: {
    cacheEnabled: env.THUMBNAIL_CACHE_ENABLED,
  },
  models: {
    enabled: env.MODEL_VIEWER_CDN_ENABLED,
    cacheDuration: env.GLTF_CACHE_DURATION,
    preloadEnabled: env.MODEL_VIEWER_PRELOAD_ENABLED,
  },
} as const;

// Configuration summary for startup logging
export const getConfigSummary = () => ({
  environment: env.NODE_ENV,
  port: server.port,
  database: {
    connected: !!database.url,
    ssl: {
      enabled: env.DATABASE_SSL_ENABLED,
      rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
      customCA: !!env.DATABASE_SSL_CA,
    },
  },
  cors: {
    origins:
      typeof server.corsOrigin === "string"
        ? server.corsOrigin
        : Array.isArray(server.corsOrigin)
          ? server.corsOrigin.length
          : 0,
    credentials: server.corsCredentials,
  },
  features: {
    cacheWarming: features.cacheWarming,
    debugLogs: features.debugLogs,
    performanceMonitoring: features.performanceMonitoring,
  },
  cdn: {
    enabled: cdn.enabled,
    domain: cdn.domain,
    partitioning: cdn.partitioning.enabled,
    thumbnailCache: cdn.thumbnails.cacheEnabled,
  },
  security: {
    sslEnabled: env.DATABASE_SSL_ENABLED,
    sslSecure: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
    rateLimitEnabled: server.rateLimitEnabled,
    apiKeys: {
      admin: !!security.adminApiKey,
      enterprise: !!security.enterpriseApiKey,
      migration: !!security.migrationApiKey,
    },
  },
  development: {
    isDev: development.isDev,
    version: development.packageVersion,
  },
});

// Export types for TypeScript support
export type Environment = typeof env;
export type DatabaseConfig = typeof database;
export type ServerConfig = typeof server;
export type LoggingConfig = typeof logging;
export type SecurityConfig = typeof security;
export type DevelopmentConfig = typeof development;
export type FeaturesConfig = typeof features;
export type CDNConfig = typeof cdn;
