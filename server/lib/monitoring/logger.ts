/**
 * SMART LOGGER - Structured Logging System
 * Phase 3 (Observability): JSON-based structured logging with correlation IDs
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { isDevelopment, logging } from "../../config/environment.js";

// AsyncLocalStorage for request-scoped correlation IDs
export const correlationContext = new AsyncLocalStorage<string>();

interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

interface StructuredLogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "PERF";
  message: string;
  service?: string;
  correlationId?: string;
  metadata?: unknown;
  stack?: string;
}

class SmartLogger {
  private static instance: SmartLogger;
  private isDevelopment: boolean;
  private logLevel: number;
  private useStructuredLogging: boolean;
  private serviceName: string = "run-apparel-api";

  private readonly LOG_LEVELS: LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  private constructor() {
    this.isDevelopment = isDevelopment;
    this.useStructuredLogging = process.env.STRUCTURED_LOGGING === "true" || !isDevelopment;

    // Use centralized logging configuration
    const levelMap = {
      debug: this.LOG_LEVELS.DEBUG,
      info: this.LOG_LEVELS.INFO,
      warn: this.LOG_LEVELS.WARN,
      error: this.LOG_LEVELS.ERROR,
    };

    this.logLevel =
      levelMap[logging.level] ||
      (this.isDevelopment ? this.LOG_LEVELS.DEBUG : this.LOG_LEVELS.WARN);
  }

  public static getInstance(): SmartLogger {
    if (!SmartLogger.instance) {
      SmartLogger.instance = new SmartLogger();
    }
    return SmartLogger.instance;
  }

  /**
   * Get current correlation ID from AsyncLocalStorage
   */
  private getCorrelationId(): string | undefined {
    return correlationContext.getStore();
  }

  /**
   * CHUNK 8: Sensitive data patterns that should be redacted from logs
   * Prevents accidental logging of secrets, passwords, tokens, API keys
   */
  private readonly SENSITIVE_KEYS = [
    "password",
    "passwd",
    "pwd",
    "secret",
    "token",
    "apikey",
    "api_key",
    "accesstoken",
    "access_token",
    "refreshtoken",
    "refresh_token",
    "auth",
    "authorization",
    "bearer",
    "session",
    "cookie",
    "csrf",
    "private_key",
    "privatekey",
    "key",
    "credential",
    "credentials",
    "database_url",
    "db_url",
    "connection_string",
    "connectionstring",
    "smtp_password",
    "email_password",
    "oauth_secret",
    "client_secret",
  ];

  /**
   * CHUNK 8: Sanitize sensitive data from logs
   * Recursively redacts sensitive fields from objects and strings
   */
  private sanitize(data: unknown): unknown {
    // Handle null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Handle strings - check for sensitive patterns
    if (typeof data === "string") {
      // Redact common sensitive string patterns (e.g., Bearer tokens, API keys)
      return data
        .replace(/Bearer\s+[\w\-._~+/]+=*/gi, "Bearer [REDACTED]")
        .replace(/api[_-]?key[:\s=]+[\w-]+/gi, "api_key=[REDACTED]")
        .replace(/token[:\s=]+[\w\-._~+/]+=*/gi, "token=[REDACTED]")
        .replace(/password[:\s=]+\S+/gi, "password=[REDACTED]");
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    // Handle objects
    if (typeof data === "object") {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // Check if key matches sensitive patterns
        const isSensitive = this.SENSITIVE_KEYS.some((pattern) =>
          lowerKey.includes(pattern.toLowerCase()),
        );

        if (isSensitive) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }

      return sanitized;
    }

    // Return primitives as-is (numbers, booleans, etc.)
    return data;
  }

  /**
   * Safely stringify metadata with circular reference handling and sanitization
   */
  private safeStringify(obj: unknown): unknown {
    // CHUNK 8: Sanitize first to prevent logging secrets
    const sanitized = this.sanitize(obj);

    const seen = new WeakSet();
    return JSON.parse(
      JSON.stringify(sanitized, (_key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      }),
    );
  }

  /**
   * Format structured log entry as JSON
   */
  private formatStructured(
    level: StructuredLogEntry["level"],
    message: string,
    metadata?: unknown,
    error?: Error,
  ): string {
    // CHUNK 8: Sanitize message to prevent secret leakage
    const sanitizedMessage =
      typeof message === "string" ? (this.sanitize(message) as string) : message;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: sanitizedMessage,
      service: this.serviceName,
    };

    const correlationId = this.getCorrelationId();
    if (correlationId) {
      entry.correlationId = correlationId;
    }

    if (metadata !== null && metadata !== undefined) {
      try {
        // Handle primitives (string, number, boolean) by wrapping in object
        if (
          typeof metadata === "string" ||
          typeof metadata === "number" ||
          typeof metadata === "boolean"
        ) {
          entry.metadata = { value: metadata };
        } else if (typeof metadata === "object") {
          // Serialize all objects (including Date, Map, Error, etc.) - rely on try/catch for failures
          entry.metadata = this.safeStringify(metadata);
        }
      } catch (_err) {
        entry.metadata = { serializationError: "Failed to serialize metadata" };
      }
    }

    if (error) {
      entry.stack = error.stack;
      const hasErrorMetadata =
        typeof metadata === "object" &&
        metadata !== null &&
        ("error" in metadata || "message" in metadata);
      if (!hasErrorMetadata) {
        entry.metadata = {
          ...(typeof entry.metadata === "object" ? entry.metadata : {}),
          error: error.message,
        };
      }
    }

    return JSON.stringify(entry);
  }

  /**
   * Output log with appropriate formatting
   */
  private output(
    level: StructuredLogEntry["level"],
    message: string,
    metadata?: unknown,
    error?: Error,
  ): void {
    if (this.useStructuredLogging) {
      const _formatted = this.formatStructured(level, message, metadata, error);
      switch (level) {
        case "ERROR":
          console.error(_formatted);
          break;
        case "WARN":
          console.warn(_formatted);
          break;
        default:
          console.log(_formatted);
      }
    } else {
      // Development mode: human-readable format
      const prefix = `[${level}]`;
      const correlationId = this.getCorrelationId();
      const corrStr = correlationId ? ` [${correlationId}]` : "";

      // CHUNK 8: Sanitize message and metadata before logging
      const sanitizedMessage =
        typeof message === "string" ? (this.sanitize(message) as string) : message;
      const sanitizedMetadata = this.sanitize(metadata);

      let metaStr = "";
      try {
        metaStr = sanitizedMetadata ? ` ${JSON.stringify(sanitizedMetadata)}` : "";
      } catch (_err) {
        metaStr = " [metadata: circular reference]";
      }

      const _logMessage = `${prefix}${corrStr} ${sanitizedMessage}${metaStr}`;

      switch (level) {
        case "ERROR":
          console.error(_logMessage);
          break;
        case "WARN":
          console.warn(_logMessage);
          break;
        default:
          console.log(_logMessage);
      }
    }
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, metadata?: unknown, error?: Error): void {
    if (this.logLevel <= this.LOG_LEVELS.DEBUG) {
      this.output("DEBUG", message, metadata, error);
    }
  }

  /**
   * Info logging - development and important production info
   */
  info(message: string, metadata?: unknown, error?: Error): void {
    if (this.logLevel <= this.LOG_LEVELS.INFO) {
      this.output("INFO", message, metadata, error);
    }
  }

  /**
   * Warning logging - always logged
   */
  warn(message: string, metadata?: unknown, error?: Error): void {
    if (this.logLevel <= this.LOG_LEVELS.WARN) {
      this.output("WARN", message, metadata, error);
    }
  }

  /**
   * Error logging - always logged
   */
  error(message: string, metadata?: unknown, error?: Error): void {
    // Sentry Hook: Capture invalid usage or explicit errors
    if (error instanceof Error) {
      import("@sentry/node")
        .then((Sentry) => {
          Sentry.captureException(error, {
            extra: { message, metadata },
          });
        })
        .catch(() => {
          /* Ignore if Sentry fails to load */
        });
    }

    this.output("ERROR", message, metadata, error);
  }

  /**
   * Performance logging - only in development unless critical
   */
  performance(
    message: string,
    metadata?: unknown,
    error?: Error,
    isCritical: boolean = false,
  ): void {
    if (this.isDevelopment || isCritical) {
      this.output("PERF", message, metadata, error);
    }
  }

  /**
   * Production-safe debug logging (legacy support)
   */
  devLog(_message: string, ..._args: unknown[]): void {
    if (this.isDevelopment) {
    }
  }
}

export const logger = SmartLogger.getInstance();

/**
 * Type-safe error serializer for unknown errors from catch blocks
 * Converts unknown errors into loggable Record<string, any>
 */
export function serializeError(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === "object") {
    try {
      return { error: JSON.stringify(error) };
    } catch {
      return { error: String(error) };
    }
  }

  return { error: String(error) };
}

// Production-safe debug helpers
export const debugLog = (_message: string, ..._args: unknown[]) => {
  if (logging.enableDebug) {
  }
};

export const productionLog = (_message: string, ..._args: unknown[]) => {};
