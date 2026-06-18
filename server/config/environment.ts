/**
 * CENTRALIZED ENVIRONMENT CONFIGURATION
 * Single source of truth for all environment variables.
 * Provides validation, type safety, and standardized access.
 * Refactored to use consolidated master schema (Phase 0 Restoration).
 */

import "dotenv/config";
import { validateEnv } from "../../shared/schemas/env.schema.js";

// Validated environment configuration
// (Early validation in index.ts/server.ts will populate process.env)
const env = validateEnv(process.env);

// Environment utilities
const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Database configuration with secure SSL defaults
export const database: {
  readonly url: string;
  readonly directUrl: string | undefined;
  readonly ssl:
    | false
    | {
        rejectUnauthorized: boolean;
        ca: string | undefined;
      };
} = {
  url: env.DATABASE_URL,
  directUrl: env.DIRECT_DATABASE_URL,
  ssl: env.DATABASE_SSL_ENABLED
    ? {
        rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
        ca: env.DATABASE_SSL_CA || undefined,
      }
    : false,
};

// CORS origin allowlist builder
const corsOrigins: string[] = (() => {
  if (env.CORS_ALLOWED_ORIGINS === "*") {
    return ["*"];
  }
  if (!env.CORS_ALLOWED_ORIGINS) {
    return [];
  }
  return env.CORS_ALLOWED_ORIGINS.split(",").map((origin: string) => origin.trim());
})();

// Server configuration with secure CORS
const server = {
  port: env.PORT,
  corsOrigin: corsOrigins,
  corsCredentials: env.CORS_ALLOW_CREDENTIALS,
  rateLimitEnabled: env.RATE_LIMIT_ENABLED,
} as const;

// Logging configuration
const logging = {
  level: env.LOG_LEVEL,
  enableDebug: env.ENABLE_DEBUG_LOGS || isDevelopment,
  enablePerformanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING,
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
  },
} as const;

// Security configuration
const security = {
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
const development = {
  isDev: env.DEV || isDevelopment,
  packageVersion: env.npm_package_version || "1.0.0",
} as const;

// Feature flags
const features = {
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
