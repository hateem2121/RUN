// Production Environment Configuration
// PHASE 4: Production Readiness - Environment Management

export interface ProductionConfig {
  // Database Configuration
  database: {
    maxConnections: number;
    queryTimeout: number;
    enableReadReplicas: boolean;
  };

  // Performance Configuration
  cache: {
    defaultTTL: number;
    maxSize: number;
    hitRateThreshold: number;
  };

  // Security Configuration
  security: {
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
    cors: {
      origins: string[];
      credentials: boolean;
    };
    headers: {
      enableSecurity: boolean;
      hsts: boolean;
    };
  };

  // Monitoring Configuration
  monitoring: {
    enableMetrics: boolean;
    alertThresholds: {
      responseTime: number;
      errorRate: number;
      cacheHitRate: number;
    };
    logLevel: "error" | "warn" | "info" | "debug";
  };

  // Application Configuration
  app: {
    environment: "production" | "staging" | "development";
    enableDebugMode: boolean;
    maxRequestSize: string;
    requestTimeout: number;
  };
}

export const productionConfig: ProductionConfig = {
  database: {
    maxConnections: 20,
    queryTimeout: 30000, // 30 seconds
    enableReadReplicas: false, // Replit doesn't support read replicas
  },

  cache: {
    defaultTTL: 300000, // 5 minutes
    maxSize: 500, // Increased for production
    hitRateThreshold: 85, // Higher threshold for production
  },

  security: {
    rateLimiting: {
      windowMs: 60000, // 1 minute
      maxRequests: 1000, // Increased for admin operations - 16.6 req/sec
    },
    cors: {
      origins: process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(",")
        : ["*"],
      credentials: true,
    },
    headers: {
      enableSecurity: true,
      hsts: true,
    },
  },

  monitoring: {
    enableMetrics: true,
    alertThresholds: {
      responseTime: 500, // 500ms threshold
      errorRate: 1, // 1% error rate threshold
      cacheHitRate: 85, // 85% cache hit rate threshold
    },
    logLevel: "warn", // Only warn and error in production
  },

  app: {
    environment: "production",
    enableDebugMode: false,
    maxRequestSize: "10mb", // CHUNK 13: Production-ready limit (media uploads have separate handling)
    requestTimeout: 30000, // 30 seconds
  },
};

export const stagingConfig: ProductionConfig = {
  ...productionConfig,
  app: {
    ...productionConfig.app,
    environment: "staging",
    enableDebugMode: true, // Debug enabled in staging
  },
  monitoring: {
    ...productionConfig.monitoring,
    logLevel: "info", // More verbose logging in staging
  },
  security: {
    ...productionConfig.security,
    rateLimiting: {
      windowMs: 60000,
      maxRequests: 200, // More lenient in staging
    },
  },
};

export const developmentConfig: ProductionConfig = {
  ...productionConfig,
  app: {
    ...productionConfig.app,
    environment: "development",
    enableDebugMode: true,
  },
  monitoring: {
    ...productionConfig.monitoring,
    logLevel: "debug", // Full logging in development
    alertThresholds: {
      responseTime: 1000, // More lenient thresholds
      errorRate: 5,
      cacheHitRate: 70,
    },
  },
  security: {
    ...productionConfig.security,
    cors: {
      origins: ["*"], // Allow all origins in development
      credentials: true,
    },
    rateLimiting: {
      windowMs: 60000,
      maxRequests: 1000, // Very lenient in development
    },
  },
  cache: {
    ...productionConfig.cache,
    defaultTTL: 60000, // Shorter cache in development
  },
};

// Environment Detection and Config Selection
export function getConfig(): ProductionConfig {
  const nodeEnv = process.env.NODE_ENV;
  const replitEnv = process.env.REPLIT_ENVIRONMENT;

  // Determine environment priority: NODE_ENV > REPLIT_ENVIRONMENT > development
  const environment = nodeEnv || replitEnv || "development";

  switch (environment) {
    case "production":
      return productionConfig;
    case "staging":
      return stagingConfig;
    default:
      return developmentConfig;
  }
}

// Configuration Validation
export function validateConfig(config: ProductionConfig): boolean {
  try {
    // Validate required configuration values
    if (!config.app.environment) return false;
    if (config.cache.defaultTTL <= 0) return false;
    if (config.security.rateLimiting.maxRequests <= 0) return false;
    if (config.monitoring.alertThresholds.responseTime <= 0) return false;

    return true;
  } catch (error) {
    return false;
  }
}
