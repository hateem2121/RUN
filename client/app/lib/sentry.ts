import * as Sentry from "@sentry/react";

declare global {
  interface Window {
    ENV?: {
      SENTRY_DSN?: string;
      SENTRY_ENVIRONMENT?: string;
    };
  }
}

export function initSentry() {
  const dsn = window.ENV?.SENTRY_DSN;
  const environment = window.ENV?.SENTRY_ENVIRONMENT || "production";

  if (!dsn) {
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      // Accessibility: Avoid capturing too much in Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  } catch (_error) {}
}
