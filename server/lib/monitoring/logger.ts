import { AsyncLocalStorage } from "node:async_hooks";
import pino, { stdSerializers, type Logger } from "pino";
import { isDevelopment, logging } from "../../config/environment.js";

// AsyncLocalStorage for request-scoped correlation IDs
export const correlationContext = new AsyncLocalStorage<string>();

class SmartLogger {
  private static instance: SmartLogger;
  private logger: Logger;
  private isDevelopment: boolean;
  private logLevel: string;

  private constructor() {
    this.isDevelopment = isDevelopment;
    this.logLevel = logging.level || (isDevelopment ? "debug" : "warn");

    // Pino configuration
    this.logger = pino({
      level: this.logLevel,
      redact: {
        paths: [
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
          // Object paths
          "req.headers.authorization",
          "req.headers.cookie",
        ],
        censor: "[REDACTED]",
      },
      serializers: {
        err: stdSerializers.err,
        req: stdSerializers.req,
        res: stdSerializers.res,
      },
      // Mixin to inject correlation ID into every log
      mixin: () => {
        const correlationId = correlationContext.getStore();
        return correlationId ? { correlationId } : {};
      },
      // Pretty printing in development
      transport: isDevelopment
        ? {
            target: "pino-pretty",
            options: {
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
              colorize: true,
              messageFormat: "{msg} {metadata}", // Display metadata if present
            },
          }
        : undefined,
      // Base service name
      base: {
        service: "run-apparel-api",
      },
    });
  }

  public static getInstance(): SmartLogger {
    if (!SmartLogger.instance) {
      SmartLogger.instance = new SmartLogger();
    }
    return SmartLogger.instance;
  }

  /**
   * Safe metadata serializer handling errors and objects
   */
  private prepareMetadata(metadata?: unknown, error?: Error): object {
    const meta: Record<string, any> = {};

    if (metadata) {
      if (typeof metadata === "object" && metadata !== null) {
        Object.assign(meta, metadata);
      } else {
        meta.metadata = metadata;
      }
    }

    if (error) {
      meta.err = error;
    }

    return meta;
  }

  debug(message: string, metadata?: unknown, error?: Error): void {
    const obj = this.prepareMetadata(metadata, error);
    if (Object.keys(obj).length > 0) {
      this.logger.debug(obj, message);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, metadata?: unknown, error?: Error): void {
    const obj = this.prepareMetadata(metadata, error);
    if (Object.keys(obj).length > 0) {
      this.logger.info(obj, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, metadata?: unknown, error?: Error): void {
    const obj = this.prepareMetadata(metadata, error);
    if (Object.keys(obj).length > 0) {
      this.logger.warn(obj, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, metadata?: unknown, error?: Error): void {
    const obj = this.prepareMetadata(metadata, error);

    // Sentry hook logic could go here, or we rely on Sentry's existing instrumentation
    // The previous implementation had explicit Sentry capture.
    // Best practice: Use automatic instrumentation (already in package.json),
    // but explicit capture is good for manual log.error calls.
    if (error && !process.env.SENTRY_DISABLE_AUTO_UPLOAD) {
      // Simple guard
      // We'll leave Sentry hooks to the global error handler or OTel instrumentation
      // to avoid importing Sentry here which might cause circular deps or bundle bloat if shared.
      // (Though previously it dynamically imported @sentry/node)
      this.captureSentry(message, metadata, error);
    }

    if (Object.keys(obj).length > 0) {
      this.logger.error(obj, message);
    } else {
      this.logger.error(message);
    }
  }

  private captureSentry(message: string, metadata: unknown, error: Error) {
    // Dynamic import to avoid strict dependency on boot
    import("@sentry/node")
      .then((Sentry) => {
        Sentry.captureException(error, {
          extra: { message, metadata },
        });
      })
      .catch(() => {});
  }

  performance(
    message: string,
    metadata?: unknown,
    error?: Error,
    isCritical: boolean = false,
  ): void {
    if (this.isDevelopment || isCritical) {
      // Log as info with label 'PERF'
      // Pino doesn't have custom levels by default unless configured.
      // We'll use info with a tag.
      this.logger.info(
        { ...this.prepareMetadata(metadata, error), type: "PERF" },
        message,
      );
    }
  }

  /**
   * Production-safe debug logging (legacy support)
   */
  devLog(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      this.logger.debug({ args }, message);
    }
  }
}

export const logger = SmartLogger.getInstance();

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
export const debugLog = (message: string, ...args: unknown[]) => {
  if (logging.enableDebug) {
    logger.debug(message, { args });
  }
};

export const productionLog = (message: string, ...args: unknown[]) => {
  // Legacy placeholder
};
