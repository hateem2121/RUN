import type { Metric } from "web-vitals";

/**
 * CORE WEB VITALS MONITORING
 * Captures and reports LCP, FID, CLS, FCP, and TTFB.
 *
 * In development: Logs metrics to the console for immediate feedback.
 * In production: Can be configured to send data to an analytics endpoint.
 */

export function reportWebVitals(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  };

  // Performance Logging Pattern (CHUNK 42: Modern Monitoring)
  if (process.env.NODE_ENV === "development") {
    const color =
      metric.rating === "good" ? "🟢" : metric.rating === "needs-improvement" ? "🟡" : "🔴";
    console.log(
      `%c[Web Vitals] ${color} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      "font-weight: bold; color: #6366f1;",
    );
  } else {
    // Production: Use navigator.sendBeacon for non-blocking data transfer
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const url = "/api/analytics/vitals";
      navigator.sendBeacon(url, JSON.stringify(body));
    }
  }
}
