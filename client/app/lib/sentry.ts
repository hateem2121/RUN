import * as Sentry from "@sentry/react";

declare global {
  interface Window {
    ENV?: {
      SENTRY_DSN?: string;
      SENTRY_ENVIRONMENT?: string;
      SENTRY_RELEASE?: string;
    };
  }
}

// Helper recursively scrubs PII and credentials from client error details
// biome-ignore lint/suspicious/noExplicitAny: recursively scrubs any object type
function scrubObject(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === "string") {
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

export function initSentry() {
  const dsn = window.ENV?.SENTRY_DSN;
  const environment = window.ENV?.SENTRY_ENVIRONMENT || "production";
  const release = window.ENV?.SENTRY_RELEASE;

  if (!dsn) {
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      // Accessibility: Avoid capturing too much in Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
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
  } catch (_error) {}
}
