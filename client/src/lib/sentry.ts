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
    console.log("[Sentry] Client skipped initialization (No DSN)");
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
      tracesSampleRate: 1.0,
    });
    console.log(`[Sentry] Client initialized (${environment})`);
  } catch (error) {
    console.error("[Sentry] Client initialization failed", error);
  }
}
