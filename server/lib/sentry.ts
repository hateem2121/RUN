import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logging } from "../config/environment.js";
import { logger } from "./smart-logger.js";

/**
 * Initialize Sentry for backend error tracking
 */
export function initSentry() {
  if (!logging.sentry.dsn) {
    logger.info("[Sentry] Skipped initialization (No DSN provided)");
    return;
  }

  try {
    Sentry.init({
      dsn: logging.sentry.dsn,
      environment: logging.sentry.environment,
      integrations: [
        // HTTP calls tracing
        Sentry.httpIntegration(),
        // Express middleware tracing
        Sentry.expressIntegration(),
        // Profiling
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });

    logger.info(`[Sentry] ✅ Initialized for env: ${logging.sentry.environment}`);
  } catch (error) {
    logger.error("[Sentry] ❌ Failed to initialize:", error);
  }
}

// Manual middleware implementation for Sentry v10 compatibility
export const sentryRequestHandler = (_req: any, _res: any, next: any) => {
  return next();
};

export const sentryTracingHandler = (_req: any, _res: any, next: any) => {
  return next();
};

export const sentryErrorHandler = (err: any, req: any, _res: any, next: any) => {
  if (logging.sentry.dsn) {
    Sentry.withScope((scope) => {
      scope.setSDKProcessingMetadata({ request: req });
      Sentry.captureException(err);
    });
  }
  next(err);
};
