/**
 * CENTRALIZED ENVIRONMENT CONFIGURATION
 * Single source of truth for all environment variables
 * Provides validation, type safety, and standardized access
 */
export declare const env: any;
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const isTest: boolean;
export declare const database: {
  readonly url: any;
  readonly ssl:
    | false
    | {
        rejectUnauthorized: any;
        ca: any;
      };
};
export declare const replit: {
  readonly dbUrl: any;
  readonly domains: any;
  readonly replId: any;
  readonly slug: any;
  readonly owner: any;
  readonly appStorageBucket: any;
  readonly objStoreBucketId: any;
  readonly devDomain: any;
  readonly privateObjectDir: any;
};
export declare const server: {
  readonly port: any;
  readonly corsOrigin: string | string[];
  readonly corsCredentials: any;
  readonly rateLimitEnabled: any;
};
export declare const logging: {
  readonly level: any;
  readonly enableDebug: any;
  readonly enablePerformanceMonitoring: any;
};
export declare const security: {
  readonly adminApiKey: any;
  readonly enterpriseApiKey: any;
  readonly migrationApiKey: any;
};
export declare const development: {
  readonly isDev: any;
  readonly packageVersion: any;
};
export declare const features: {
  readonly cacheWarming: any;
  readonly debugLogs: any;
  readonly performanceMonitoring: any;
};
export declare const cdn: {
  readonly domain: any;
  readonly enabled: boolean;
  readonly partitioning: {
    readonly enabled: any;
    readonly publicPartition: any;
    readonly privatePartition: any;
  };
  readonly thumbnails: {
    readonly cacheEnabled: any;
  };
  readonly models: {
    readonly enabled: any;
    readonly cacheDuration: any;
    readonly preloadEnabled: any;
  };
};
export declare const getConfigSummary: () => {
  environment: any;
  port: any;
  database: {
    connected: boolean;
    ssl: {
      enabled: any;
      rejectUnauthorized: any;
      customCA: boolean;
    };
  };
  cors: {
    origins: string | number;
    credentials: any;
  };
  replit: {
    dbUrl: boolean;
    replId: boolean;
    domains: boolean;
    storage: {
      appBucket: boolean;
      objStoreBucket: boolean;
      privateDir: boolean;
    };
  };
  features: {
    cacheWarming: any;
    debugLogs: any;
    performanceMonitoring: any;
  };
  cdn: {
    enabled: boolean;
    domain: any;
    partitioning: any;
    thumbnailCache: any;
  };
  security: {
    sslEnabled: any;
    sslSecure: any;
    rateLimitEnabled: any;
    apiKeys: {
      admin: boolean;
      enterprise: boolean;
      migration: boolean;
    };
  };
  development: {
    isDev: any;
    version: any;
  };
};
export type Environment = typeof env;
export type DatabaseConfig = typeof database;
export type ReplitConfig = typeof replit;
export type ServerConfig = typeof server;
export type LoggingConfig = typeof logging;
export type SecurityConfig = typeof security;
export type DevelopmentConfig = typeof development;
export type FeaturesConfig = typeof features;
export type CDNConfig = typeof cdn;
