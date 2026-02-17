/**
 * CENTRALIZED ENVIRONMENT CONFIGURATION
 * Single source of truth for all environment variables
 * Provides validation, type safety, and standardized access
 */
import "dotenv/config";
import { z } from "zod";
declare const environmentSchema: z.ZodObject<
  {
    NODE_ENV: z.ZodDefault<
      z.ZodEnum<{
        production: "production";
        development: "development";
        test: "test";
      }>
    >;
    PORT: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<number, string>>;
    DATABASE_URL: z.ZodDefault<z.ZodString>;
    DATABASE_SSL_ENABLED: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
    DATABASE_SSL_REJECT_UNAUTHORIZED: z.ZodPipe<
      z.ZodDefault<z.ZodString>,
      z.ZodTransform<boolean, string>
    >;
    DATABASE_SSL_CA: z.ZodOptional<z.ZodString>;
    GCS_BUCKET_NAME: z.ZodOptional<z.ZodString>;
    GOOGLE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GOOGLE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    GOOGLE_CLOUD_PROJECT: z.ZodOptional<z.ZodString>;
    GOOGLE_CLOUD_LOCATION: z.ZodDefault<z.ZodString>;
    RECAPTCHA_SECRET_KEY: z.ZodOptional<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<
      z.ZodEnum<{
        debug: "debug";
        error: "error";
        info: "info";
        warn: "warn";
      }>
    >;
    ENABLE_PERFORMANCE_MONITORING: z.ZodPipe<
      z.ZodDefault<z.ZodString>,
      z.ZodTransform<boolean, string>
    >;
    SENTRY_DSN: z.ZodOptional<z.ZodString>;
    SENTRY_ENVIRONMENT: z.ZodOptional<z.ZodString>;
    SENTRY_REPORT_URI: z.ZodOptional<z.ZodString>;
    CORS_ALLOWED_ORIGINS: z.ZodOptional<z.ZodString>;
    CORS_ALLOW_CREDENTIALS: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
    RATE_LIMIT_ENABLED: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
    ADMIN_API_KEY: z.ZodOptional<z.ZodString>;
    ENTERPRISE_API_KEY: z.ZodOptional<z.ZodString>;
    MIGRATION_API_KEY: z.ZodOptional<z.ZodString>;
    SESSION_SECRET: z.ZodDefault<z.ZodString>;
    INITIAL_ADMIN_EMAIL: z.ZodOptional<z.ZodString>;
    DEV: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>>;
    npm_package_version: z.ZodOptional<z.ZodString>;
    ENABLE_DEBUG_LOGS: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
    ENABLE_CACHE_WARMING: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
    GLTF_CACHE_DURATION: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<number, string>>;
    MODEL_VIEWER_CDN_ENABLED: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
    MODEL_VIEWER_PRELOAD_ENABLED: z.ZodPipe<
      z.ZodDefault<z.ZodString>,
      z.ZodTransform<boolean, string>
    >;
    OBJECT_STORAGE_CDN_DOMAIN: z.ZodOptional<z.ZodString>;
    PUBLIC_ASSET_PARTITION: z.ZodDefault<z.ZodString>;
    PRIVATE_ASSET_PARTITION: z.ZodDefault<z.ZodString>;
    ENABLE_CDN_PARTITIONING: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
    THUMBNAIL_CACHE_ENABLED: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<boolean, string>>;
  },
  z.core.$strip
>;
export declare let env: z.infer<typeof environmentSchema>;
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const isTest: boolean;
export declare const database: {
  readonly url: string;
  readonly ssl:
    | false
    | {
        rejectUnauthorized: boolean;
        ca: string | undefined;
      };
};
export declare const server: {
  readonly port: number;
  readonly corsOrigin: string[];
  readonly corsCredentials: boolean;
  readonly rateLimitEnabled: boolean;
};
export declare const logging: {
  readonly level: "debug" | "error" | "info" | "warn";
  readonly enableDebug: boolean;
  readonly enablePerformanceMonitoring: boolean;
  readonly sentry: {
    readonly dsn: string | undefined;
    readonly environment: string;
  };
};
export declare const security: {
  readonly adminApiKey: string | undefined;
  readonly enterpriseApiKey: string | undefined;
  readonly migrationApiKey: string | undefined;
  readonly sessionSecret: string;
  readonly initialAdminEmail: string | undefined;
  readonly recaptchaSecret: string | undefined;
};
export declare const cloud: {
  readonly project: string | undefined;
  readonly location: string;
  readonly bucket: string | undefined;
};
export declare const development: {
  readonly isDev: boolean;
  readonly packageVersion: string;
};
export declare const features: {
  readonly cacheWarming: boolean;
  readonly debugLogs: boolean;
  readonly performanceMonitoring: boolean;
};
export declare const cdn: {
  readonly domain: string | undefined;
  readonly enabled: boolean;
  readonly partitioning: {
    readonly enabled: boolean;
    readonly publicPartition: string;
    readonly privatePartition: string;
  };
  readonly thumbnails: {
    readonly cacheEnabled: boolean;
  };
  readonly models: {
    readonly enabled: boolean;
    readonly cacheDuration: number;
    readonly preloadEnabled: boolean;
  };
};
export declare const getConfigSummary: () => {
  environment: "production" | "development" | "test";
  port: number;
  database: {
    connected: boolean;
    ssl: {
      enabled: boolean;
      rejectUnauthorized: boolean;
      customCA: boolean;
    };
  };
  cors: {
    origins: number;
    credentials: boolean;
  };
  features: {
    cacheWarming: boolean;
    debugLogs: boolean;
    performanceMonitoring: boolean;
  };
  cdn: {
    enabled: boolean;
    domain: string | undefined;
    partitioning: boolean;
    thumbnailCache: boolean;
  };
  security: {
    sslEnabled: boolean;
    sslSecure: boolean;
    rateLimitEnabled: boolean;
    apiKeys: {
      admin: boolean;
      enterprise: boolean;
      migration: boolean;
    };
  };
  development: {
    isDev: boolean;
    version: string;
  };
};
export type Environment = typeof env;
export type DatabaseConfig = typeof database;
export type ServerConfig = typeof server;
export type LoggingConfig = typeof logging;
export type SecurityConfig = typeof security;
export type DevelopmentConfig = typeof development;
export type FeaturesConfig = typeof features;
export type CDNConfig = typeof cdn;
//# sourceMappingURL=environment.d.ts.map
