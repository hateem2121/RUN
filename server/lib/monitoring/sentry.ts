import * as Sentry from "@sentry/node";
import { env } from "../../lib/env.js";
import { APP_VERSION } from "../utilities/version.js";
import { logger } from "./logger.js";

// Helper recursively scrubs PII and credentials from error details
// biome-ignore lint/suspicious/noExplicitAny: recursively scrubs any object type
function scrubObject(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === "string") {
    // Redact email addresses
    return obj.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  }
  if (Array.isArray(obj)) {
    return obj.map(scrubObject);
  }
  if (typeof obj === "object") {
    // biome-ignore lint/suspicious/noExplicitAny: record of any
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      if (
        [
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
          "name",
          "email",
          "phone",
          "company",
          "message",
          "preferredplatform",
        ].includes(lowerKey)
      ) {
        newObj[key] = "[REDACTED]";
      } else {
        newObj[key] = scrubObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

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
    release: process.env.SENTRY_RELEASE || APP_VERSION,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [], // Add standard integrations if needed, but start with baseline
    beforeSend(event) {
      if (event.request?.headers) {
        for (const header of ["cookie", "authorization", "x-csrf-token"]) {
          if (event.request.headers[header]) {
            event.request.headers[header] = "[REDACTED]";
          }
        }
      }
      if (event.request?.data) {
        event.request.data = scrubObject(event.request.data);
      }
      if (event.extra) {
        event.extra = scrubObject(event.extra);
      }
      return event;
    },
  });

  logger.info("[Sentry] Server-side reporting initialized.");
}
