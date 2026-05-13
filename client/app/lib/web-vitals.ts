import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

type MetricType = {
  name: string;
  value: number;
  delta: number;
  id: string;
};

function sendToAnalytics(metric: MetricType) {
  // In production, this would send to Google Analytics or a custom endpoint
  // For now, we'll log to console in a readable format during development
  const threshold = getThreshold(metric.name);
  const isPoor = metric.value > threshold;

  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed(
      `%c[Web Vitals] ${metric.name}: ${Math.round(metric.value)}${getUnit(metric.name)}`,
      `color: ${isPoor ? "#ef4444" : "#22c55e"}; font-weight: bold;`,
    );
    console.log("Value:", metric.value);
    console.log("Delta:", metric.delta);
    console.log("ID:", metric.id);
    console.log("Target:", `< ${threshold}${getUnit(metric.name)}`);
    console.groupEnd();
  } else {
    // Production: Send to analytics endpoint
    const url = "/api/analytics/vitals";
    const body = JSON.stringify(metric);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        body,
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  }
}

function getThreshold(metricName: string): number {
  switch (metricName) {
    case "CLS":
      return 0.1;
    case "INP":
      return 200;
    case "LCP":
      return 2500;
    case "FCP":
      return 1800;
    case "TTFB":
      return 800;
    default:
      return 0;
  }
}

function getUnit(metricName: string): string {
  return metricName === "CLS" ? "" : "ms";
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

export function reportCustomMetric(name: string, value: number, id?: string) {
  sendToAnalytics({
    name,
    value,
    delta: 0,
    id: id || `custom-${Date.now()}`,
  });
}
