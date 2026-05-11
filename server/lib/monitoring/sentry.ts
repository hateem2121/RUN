import * as Sentry from "@sentry/node";
import { env } from "../../lib/env.js";
import { logger } from "./logger.js";

/**
 * Server-Side Sentry Initialization
 * (EH-101 Remediation)
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN || env.SENTRY_DSN;

  if (!dsn) {
    logger.info("[Sentry] No DSN found, server-side reporting disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [], // Add standard integrations if needed, but start with baseline
  });

  logger.info("[Sentry] Server-side reporting initialized.");
}
