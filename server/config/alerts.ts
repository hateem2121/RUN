export interface AlertConfig {
  slowQuery: {
    durationMs: number;
    consecutiveCount: number;
  };
  errorRate: {
    percentageThreshold: number;
    timeWindowMinutes: number;
  };
  httpErrorRate: {
    percentageThreshold: number;
  };
  circuitBreaker: {
    alertOnOpen: boolean;
    alertOnHalfOpen: boolean;
  };
  memory: {
    percentageThreshold: number;
  };
  dbConnection: {
    alertOnError: boolean;
    alertOnTimeout: boolean;
  };
  gcPause: {
    enabled: boolean;
    thresholdMs: number;
  };
}

export const defaultAlertConfig: AlertConfig = {
  slowQuery: {
    durationMs: parseInt(process.env.ALERT_SLOW_QUERY_MS || "500", 10),
    consecutiveCount: parseInt(process.env.ALERT_SLOW_QUERY_CONSECUTIVE || "3", 10),
  },
  errorRate: {
    percentageThreshold: parseFloat(process.env.ALERT_ERROR_RATE_PERCENT || "5"),
    timeWindowMinutes: parseInt(process.env.ALERT_ERROR_WINDOW_MIN || "5", 10),
  },
  httpErrorRate: {
    percentageThreshold: parseFloat(process.env.ALERT_HTTP_ERROR_RATE_PERCENT || "5"),
  },
  circuitBreaker: {
    alertOnOpen: process.env.ALERT_CIRCUIT_OPEN !== "false",
    alertOnHalfOpen: process.env.ALERT_CIRCUIT_HALF_OPEN === "true",
  },
  memory: {
    percentageThreshold: parseFloat(process.env.ALERT_MEMORY_PERCENT || "80"),
  },
  dbConnection: {
    alertOnError: process.env.ALERT_DB_ERROR !== "false",
    alertOnTimeout: process.env.ALERT_DB_TIMEOUT !== "false",
  },
  gcPause: {
    enabled: process.env.ALERT_GC_ENABLED !== "false",
    thresholdMs: parseFloat(process.env.ALERT_GC_PAUSE_MS || "100"),
  },
};
