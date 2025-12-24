/**
 * FORENSIC INVESTIGATION - Phase 5: Core Web Vitals Tracking
 * Monitors LCP, FID, CLS, TTFB, and FCP for performance analysis
 */

import { useEffect } from "react";

export interface WebVitalsMetric {
  name: "CLS" | "FID" | "FCP" | "LCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceMetrics {
  webVitals: WebVitalsMetric[];
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  resourceCount: number;
  timestamp: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    webVitals: [],
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    resourceCount: 0,
    timestamp: Date.now(),
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking() {
    if (typeof window === "undefined") return;

    // Track Core Web Vitals using PerformanceObserver
    this.trackWebVitals();

    // Track page load metrics
    this.trackPageLoad();
  }

  private trackWebVitals() {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        this.recordMetric({
          name: "LCP",
          value: lastEntry.renderTime || lastEntry.loadTime,
          delta: lastEntry.renderTime || lastEntry.loadTime,
          id: `lcp-${Date.now()}`,
          navigationType: "navigate",
          rating: this.getRating("LCP", lastEntry.renderTime || lastEntry.loadTime),
        });
      });

      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: "FID",
            value: entry.processingStart - entry.startTime,
            delta: entry.processingStart - entry.startTime,
            id: `fid-${Date.now()}`,
            navigationType: "navigate",
            rating: this.getRating("FID", entry.processingStart - entry.startTime),
          });
        });
      });

      fidObserver.observe({ type: "first-input", buffered: true });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.recordMetric({
          name: "CLS",
          value: clsValue,
          delta: clsValue,
          id: `cls-${Date.now()}`,
          navigationType: "navigate",
          rating: this.getRating("CLS", clsValue),
        });
      });

      clsObserver.observe({ type: "layout-shift", buffered: true });
      this.observers.push(clsObserver);

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: "FCP",
            value: entry.startTime,
            delta: entry.startTime,
            id: `fcp-${Date.now()}`,
            navigationType: "navigate",
            rating: this.getRating("FCP", entry.startTime),
          });
        });
      });

      fcpObserver.observe({ type: "paint", buffered: true });
      this.observers.push(fcpObserver);
    } catch (_error) {}
  }

  private trackPageLoad() {
    if (typeof window === "undefined") return;

    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;

        // TTFB
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric({
          name: "TTFB",
          value: ttfb,
          delta: ttfb,
          id: `ttfb-${Date.now()}`,
          navigationType: "navigate",
          rating: this.getRating("TTFB", ttfb),
        });
      }

      // Get paint timing
      const paintEntries = performance.getEntriesByType("paint");
      const firstPaint = paintEntries.find((entry) => entry.name === "first-paint");
      if (firstPaint) {
        this.metrics.firstPaint = firstPaint.startTime;
      }

      // Count resources
      this.metrics.resourceCount = performance.getEntriesByType("resource").length;
      this.metrics.timestamp = Date.now();
    });
  }

  private recordMetric(metric: WebVitalsMetric) {
    // Update or add metric
    const existingIndex = this.metrics.webVitals.findIndex((m) => m.name === metric.name);

    if (existingIndex >= 0) {
      this.metrics.webVitals[existingIndex] = metric;
    } else {
      this.metrics.webVitals.push(metric);
    }

    if (import.meta.env.DEV) {
    }
  }

  private getRating(
    metricName: WebVitalsMetric["name"],
    value: number,
  ): "good" | "needs-improvement" | "poor" {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 600, poor: 1500 },
    };

    const threshold = thresholds[metricName];
    if (value <= threshold.good) return "good";
    if (value <= threshold.poor) return "needs-improvement";
    return "poor";
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getHealthStatus() {
    const poorMetrics = this.metrics.webVitals.filter((m) => m.rating === "poor");
    const needsImprovement = this.metrics.webVitals.filter((m) => m.rating === "needs-improvement");

    const issues: string[] = [];

    if (poorMetrics.length > 0) {
      issues.push(`Poor metrics: ${poorMetrics.map((m) => m.name).join(", ")}`);
    }

    if (needsImprovement.length >= 2) {
      issues.push(
        `Multiple metrics need improvement: ${needsImprovement.map((m) => m.name).join(", ")}`,
      );
    }

    if (this.metrics.pageLoadTime > 5000) {
      issues.push(`Slow page load: ${Math.round(this.metrics.pageLoadTime)}ms`);
    }

    return {
      healthy: issues.length === 0,
      status: issues.length === 0 ? "healthy" : issues.length === 1 ? "degraded" : "unhealthy",
      metrics: this.metrics,
      issues,
      timestamp: Date.now(),
    };
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * React Hook for performance tracking
 */
export function usePerformanceTracking(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    // Performance tracking is initialized automatically
    // This hook just provides access to the tracker

    return () => {
      // Cleanup on unmount
      performanceTracker.cleanup();
    };
  }, [enabled]);

  return {
    metrics: performanceTracker.getMetrics(),
    health: performanceTracker.getHealthStatus(),
  };
}
