/**
 * Core Web Vitals Monitoring for RUN Remix
 *
 * This module provides utilities for measuring and reporting Core Web Vitals
 * and other performance metrics in accordance with Google's recommendations.
 *
 * @see https://web.dev/vitals/
 * @see https://github.com/GoogleChrome/web-vitals
 *
 * @module client/app/lib/performance
 * @author RUN APPAREL (PVT) LTD
 * @version 1.0.0
 */

import {
  type CLSMetric,
  type FCPMetric,
  type INPMetric,
  type LCPMetric,
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type TTFBMetric,
} from "web-vitals";

// =============================================================================
// Types
// =============================================================================

/**
 * Metric type union for all supported web vitals
 */
type WebVitalMetric = CLSMetric | FCPMetric | INPMetric | LCPMetric | TTFBMetric;

/**
 * Core Web Vitals metrics as defined by Google
 * Note: FID is deprecated in web-vitals v4+ and replaced by INP
 */
export interface CoreWebVitals {
  /** Cumulative Layout Shift - measures visual stability */
  cls: CLSMetric | null;
  /** First Contentful Paint - measures loading performance */
  fcp: FCPMetric | null;
  /** Interaction to Next Paint - measures interactivity (replaces FID) */
  inp: INPMetric | null;
  /** Largest Contentful Paint - measures loading performance */
  lcp: LCPMetric | null;
  /** Time to First Byte - measures server responsiveness */
  ttfb: TTFBMetric | null;
}

/**
 * Performance rating levels
 */
export type PerformanceRating = "good" | "needs-improvement" | "poor";

/**
 * Thresholds for Core Web Vitals (in milliseconds, CLS is unitless)
 */
export interface VitalThresholds {
  good: number;
  poor: number;
}

/**
 * Performance report for analytics
 */
export interface PerformanceReport {
  timestamp: string;
  url: string;
  userAgent: string;
  connectionType: string;
  vitals: CoreWebVitals;
  customMetrics: Record<string, number>;
}

/**
 * Callback function type for metric reporting
 */
export type MetricCallback = (metric: PerformanceReport) => void;

// =============================================================================
// Constants
// =============================================================================

/**
 * Core Web Vitals thresholds based on Google's recommendations
 * @see https://web.dev/vitals/#core-web-vitals
 * Note: FID is deprecated and replaced by INP as of web-vitals v4+
 */
export const VITAL_THRESHOLDS: Record<string, VitalThresholds> = {
  // Core Web Vitals
  LCP: { good: 2500, poor: 4000 }, // milliseconds
  CLS: { good: 0.1, poor: 0.25 }, // unitless
  INP: { good: 200, poor: 500 }, // milliseconds (replaces FID)

  // Other important metrics
  FCP: { good: 1800, poor: 3000 }, // milliseconds
  TTFB: { good: 800, poor: 1800 }, // milliseconds
} as const;

/**
 * Metric names for reporting
 */
export const METRIC_NAMES = {
  CLS: "cumulative-layout-shift",
  FCP: "first-contentful-paint",
  INP: "interaction-to-next-paint",
  LCP: "largest-contentful-paint",
  TTFB: "time-to-first-byte",
} as const;

// =============================================================================
// Performance Rating Functions
// =============================================================================

/**
 * Rate a metric value based on its thresholds
 */
export function rateMetric(name: string, value: number): PerformanceRating {
  const thresholds = VITAL_THRESHOLDS[name.toUpperCase()];

  if (!thresholds) {
    return "good"; // Default to good for unknown metrics
  }

  if (value <= thresholds.good) {
    return "good";
  }

  if (value <= thresholds.poor) {
    return "needs-improvement";
  }

  return "poor";
}

/**
 * Get rating from web-vitals metric
 */
export function getRating(metric: {
  rating: "good" | "needs-improvement" | "poor";
}): PerformanceRating {
  return metric.rating;
}

// =============================================================================
// Performance Monitor Class
// =============================================================================

/**
 * Performance Monitor for tracking Core Web Vitals
 *
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor();
 *
 * // Start monitoring
 * monitor.start();
 *
 * // Get current metrics
 * const vitals = monitor.getVitals();
 * console.log(vitals);
 *
 * // Send to analytics
 * monitor.report((report) => {
 *   sendToAnalytics(report);
 * });
 * ```
 */
export class PerformanceMonitor {
  private vitals: CoreWebVitals = {
    cls: null,
    fcp: null,
    inp: null,
    lcp: null,
    ttfb: null,
  };

  private customMetrics: Record<string, number> = {};

  private callbacks: MetricCallback[] = [];

  private isRunning = false;

  /**
   * Start monitoring Core Web Vitals
   */
  start(): void {
    if (this.isRunning) {
      console.warn("[PerformanceMonitor] Already running");
      return;
    }

    this.isRunning = true;

    // Register web-vitals observers
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Log start in development
    if (import.meta.env.DEV) {
      console.log("[PerformanceMonitor] Started monitoring Core Web Vitals");
    }
  }

  /**
   * Handle incoming metric from web-vitals
   */
  private handleMetric(metric: WebVitalMetric): void {
    const name = metric.name.toLowerCase() as keyof CoreWebVitals;

    // Type-safe assignment using object lookup instead of switch
    if (name === "cls") {
      this.vitals.cls = metric as CLSMetric;
    } else if (name === "fcp") {
      this.vitals.fcp = metric as FCPMetric;
    } else if (name === "inp") {
      this.vitals.inp = metric as INPMetric;
    } else if (name === "lcp") {
      this.vitals.lcp = metric as LCPMetric;
    } else if (name === "ttfb") {
      this.vitals.ttfb = metric as TTFBMetric;
    }

    // Log in development
    if (import.meta.env.DEV) {
      this.logMetric(metric);
    }

    // Notify callbacks
    this.notifyCallbacks();
  }

  /**
   * Log metric to console in development
   */
  private logMetric(metric: WebVitalMetric): void {
    const value = metric.name === "CLS" ? metric.value.toFixed(3) : `${Math.round(metric.value)}ms`;
    const rating = metric.rating.toUpperCase();

    const styles: Record<"good" | "needs-improvement" | "poor", string> = {
      good: "color: #0cce6b; font-weight: bold;",
      "needs-improvement": "color: #ffa400; font-weight: bold;",
      poor: "color: #ff4e42; font-weight: bold;",
    };

    console.log(
      `[PerformanceMonitor] %c${metric.name}%c: ${value} (${rating})`,
      styles[metric.rating],
      "color: inherit;",
    );
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(): void {
    const report = this.generateReport();

    for (const callback of this.callbacks) {
      try {
        callback(report);
      } catch (error) {
        console.error("[PerformanceMonitor] Callback error:", error);
      }
    }
  }

  /**
   * Generate a performance report
   */
  generateReport(): PerformanceReport {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      vitals: { ...this.vitals },
      customMetrics: { ...this.customMetrics },
    };
  }

  /**
   * Get connection type if available
   */
  private getConnectionType(): string {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } })
      .connection;
    return connection?.effectiveType ?? "unknown";
  }

  /**
   * Get current Core Web Vitals
   */
  getVitals(): CoreWebVitals {
    return { ...this.vitals };
  }

  /**
   * Get a specific vital
   */
  getVital<K extends keyof CoreWebVitals>(name: K): CoreWebVitals[K] {
    return this.vitals[name];
  }

  /**
   * Add a custom metric
   */
  addCustomMetric(name: string, value: number): void {
    this.customMetrics[name] = value;
    this.notifyCallbacks();
  }

  /**
   * Measure a custom timing
   */
  measureTiming(name: string, startMark: string, endMark?: string): number | null {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const entries = performance.getEntriesByName(name, "measure");
      const lastEntry = entries[entries.length - 1];

      if (lastEntry) {
        const duration = lastEntry.duration;
        this.addCustomMetric(name, duration);
        return duration;
      }

      return null;
    } catch (error) {
      console.error(`[PerformanceMonitor] Failed to measure ${name}:`, error);
      return null;
    }
  }

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Register a callback for metric updates
   */
  onMetric(callback: MetricCallback): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if all core vitals have been collected
   */
  isComplete(): boolean {
    return (
      this.vitals.cls !== null &&
      this.vitals.fcp !== null &&
      this.vitals.lcp !== null &&
      this.vitals.ttfb !== null
      // FID and INP may not fire if no interactions occur
    );
  }

  /**
   * Get overall performance score
   */
  getScore(): { score: number; rating: PerformanceRating } {
    const weights = {
      lcp: 0.25,
      inp: 0.25,
      cls: 0.25,
      fcp: 0.15,
      ttfb: 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Calculate weighted score
    for (const [name, weight] of Object.entries(weights)) {
      const vital = this.vitals[name as keyof typeof weights];
      if (vital) {
        const rating = vital.rating;
        const score = rating === "good" ? 100 : rating === "needs-improvement" ? 50 : 0;
        totalScore += score * weight;
        totalWeight += weight;
      }
    }

    // Normalize score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Determine overall rating
    let rating: PerformanceRating;
    if (normalizedScore >= 90) {
      rating = "good";
    } else if (normalizedScore >= 50) {
      rating = "needs-improvement";
    } else {
      rating = "poor";
    }

    return { score: Math.round(normalizedScore), rating };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let monitorInstance: PerformanceMonitor | null = null;

/**
 * Get the global performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): PerformanceMonitor {
  const monitor = getPerformanceMonitor();
  monitor.start();
  return monitor;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Send metrics to analytics endpoint
 */
export async function sendToAnalytics(report: PerformanceReport): Promise<void> {
  const endpoint = "/api/analytics/performance";

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
      keepalive: true, // Ensure request completes even if page unloads
    });
  } catch (error) {
    console.error("[PerformanceMonitor] Failed to send analytics:", error);
  }
}

/**
 * Send metrics to Google Analytics 4
 */
export function sendToGA4(
  metric: CLSMetric | FCPMetric | INPMetric | LCPMetric | TTFBMetric,
): void {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;

  if (typeof gtag === "function") {
    gtag("event", metric.name, {
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      event_category: "Web Vitals",
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

/**
 * Format metric value for display
 */
export function formatMetricValue(name: string, value: number): string {
  switch (name.toUpperCase()) {
    case "CLS":
      return value.toFixed(3);
    default:
      return `${Math.round(value)}ms`;
  }
}

/**
 * Get performance summary for debugging
 */
export function getPerformanceSummary(): Record<string, string> {
  const monitor = getPerformanceMonitor();
  const vitals = monitor.getVitals();
  const summary: Record<string, string> = {};

  for (const [name, metric] of Object.entries(vitals)) {
    if (metric) {
      summary[name.toUpperCase()] = `${formatMetricValue(name, metric.value)} (${metric.rating})`;
    }
  }

  const { score, rating } = monitor.getScore();
  summary.SCORE = `${score}/100 (${rating})`;

  return summary;
}

// =============================================================================
// React Hook
// =============================================================================

/**
 * React hook for performance monitoring
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { vitals, score, isComplete } = usePerformanceMonitoring();
 *
 *   if (!isComplete) {
 *     return <div>Measuring performance...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Performance Score: {score}</p>
 *       <p>LCP: {vitals.lcp?.value}ms</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceMonitoring(): {
  vitals: CoreWebVitals;
  score: { score: number; rating: PerformanceRating };
  isComplete: boolean;
  addCustomMetric: (name: string, value: number) => void;
} {
  // Note: This is a simplified hook. In a real implementation,
  // you would use useState and useEffect to track changes.
  const monitor = getPerformanceMonitor();

  return {
    vitals: monitor.getVitals(),
    score: monitor.getScore(),
    isComplete: monitor.isComplete(),
    addCustomMetric: monitor.addCustomMetric.bind(monitor),
  };
}

// =============================================================================
// Export Default
// =============================================================================

export default {
  PerformanceMonitor,
  getPerformanceMonitor,
  initPerformanceMonitoring,
  sendToAnalytics,
  sendToGA4,
  formatMetricValue,
  getPerformanceSummary,
  rateMetric,
  usePerformanceMonitoring,
  VITAL_THRESHOLDS,
  METRIC_NAMES,
};
