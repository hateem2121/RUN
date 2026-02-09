// Performance Optimization: Week 3 - Bundle Analysis & Performance Monitoring
// Advanced performance monitoring system with Core Web Vitals tracking

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  bundleSize: number | null;
  memoryUsage: number | null;
  renderTime: number | null;
}

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: { name: string; size: number }[];
  dependencies: { name: string; size: number }[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    bundleSize: null,
    memoryUsage: null,
    renderTime: null,
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureRenderTime();
  }

  private initializeObservers() {
    if (typeof window === "undefined") {
      return;
    }

    // Core Web Vitals Observer
    if ("PerformanceObserver" in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          startTime: number;
        };
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & {
            processingStart: number;
            startTime: number;
          };
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
      this.observers.push(fidObserver);

      // CLS Observer
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        entryList.getEntries().forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value: number;
          };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        });
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(clsObserver);
    }

    // FCP and TTFB from Navigation Timing
    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      }

      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
      }
    });
  }

  private measureRenderTime() {
    if (typeof window === "undefined") {
      return;
    }

    const startTime = performance.now();

    // Measure after React hydration
    requestIdleCallback(() => {
      this.metrics.renderTime = performance.now() - startTime;
      this.measureMemoryUsage();
    });
  }

  private measureMemoryUsage() {
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return;
    }

    if ("memory" in performance) {
      const memory = (performance as Performance & { memory: { usedJSHeapSize: number } }).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  // Bundle Analysis (Client-side estimation)
  public async analyzeBundles(): Promise<BundleAnalysis> {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    const chunks: { name: string; size: number }[] = [];
    let totalSize = 0;

    // Estimate script sizes
    for (const script of scripts) {
      const src = (script as HTMLScriptElement).src;
      if (src?.includes("/assets/")) {
        try {
          const response = await fetch(src, { method: "HEAD" });
          const size = parseInt(response.headers.get("content-length") || "0", 10);
          const name = src.split("/").pop() || "unknown";
          chunks.push({ name, size });
          totalSize += size;
        } catch (_e) {}
      }
    }

    // Estimate stylesheet sizes
    for (const link of links) {
      const href = (link as HTMLLinkElement).href;
      if (href?.includes("/assets/")) {
        try {
          const response = await fetch(href, { method: "HEAD" });
          const size = parseInt(response.headers.get("content-length") || "0", 10);
          const name = href.split("/").pop() || "unknown";
          chunks.push({ name, size });
          totalSize += size;
        } catch (_e) {}
      }
    }

    return {
      totalSize,
      gzippedSize: totalSize * 0.3, // Estimate gzip compression
      chunks,
      dependencies: [], // Would need build-time analysis
    };
  }

  // Performance Score Calculator
  public calculatePerformanceScore(): number {
    const { fcp, lcp, fid, cls } = this.metrics;

    let score = 100;

    // FCP scoring (0-2s = good, 2-4s = needs improvement, 4s+ = poor)
    if (fcp) {
      if (fcp > 4000) {
        score -= 25;
      } else if (fcp > 2000) {
        score -= 10;
      }
    }

    // LCP scoring (0-2.5s = good, 2.5-4s = needs improvement, 4s+ = poor)
    if (lcp) {
      if (lcp > 4000) {
        score -= 25;
      } else if (lcp > 2500) {
        score -= 15;
      }
    }

    // FID scoring (0-100ms = good, 100-300ms = needs improvement, 300ms+ = poor)
    if (fid) {
      if (fid > 300) {
        score -= 20;
      } else if (fid > 100) {
        score -= 10;
      }
    }

    // CLS scoring (0-0.1 = good, 0.1-0.25 = needs improvement, 0.25+ = poor)
    if (cls) {
      if (cls > 0.25) {
        score -= 20;
      } else if (cls > 0.1) {
        score -= 10;
      }
    }

    return Math.max(0, score);
  }

  // Get current metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Generate performance report
  public generateReport(): string {
    const metrics = this.getMetrics();
    const score = this.calculatePerformanceScore();

    return `
🚀 Performance Report - RUN APPAREL Homepage
============================================

Overall Score: ${score}/100 ${score >= 90 ? "🟢" : score >= 70 ? "🟡" : "🔴"}

Core Web Vitals:
- First Contentful Paint: ${metrics.fcp ? `${(metrics.fcp / 1000).toFixed(2)}s` : "N/A"}
- Largest Contentful Paint: ${metrics.lcp ? `${(metrics.lcp / 1000).toFixed(2)}s` : "N/A"}
- First Input Delay: ${metrics.fid ? `${metrics.fid.toFixed(2)}ms` : "N/A"}
- Cumulative Layout Shift: ${metrics.cls ? metrics.cls.toFixed(3) : "N/A"}

Technical Metrics:
- Time to First Byte: ${metrics.ttfb ? `${metrics.ttfb.toFixed(2)}ms` : "N/A"}
- Render Time: ${metrics.renderTime ? `${metrics.renderTime.toFixed(2)}ms` : "N/A"}
- Memory Usage: ${metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(2)}MB` : "N/A"}

Recommendations:
${
  score < 90
    ? "- Consider further optimizing bundle sizes\n- Implement more aggressive lazy loading\n- Optimize image loading strategies"
    : "- Performance is excellent!\n- Continue monitoring for regressions"
}
    `.trim();
  }

  // Cleanup observers
  public destroy() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

// Performance utilities
export const performanceMonitor = new PerformanceMonitor();

// Export utilities for performance testing
export const measureComponentRender = (_componentName: string, fn: () => void) => {
  fn();
};

export const measureAsyncOperation = async (_operationName: string, fn: () => Promise<any>) => {
  const result = await fn();
  return result;
};

// Memory leak detection
export const detectMemoryLeaks = () => {
  if ("memory" in performance) {
    const memory = (performance as Performance & { memory: { usedJSHeapSize: number } }).memory;
    const baseline = memory.usedJSHeapSize;

    setTimeout(() => {
      const current = memory.usedJSHeapSize;
      const increase = current - baseline;

      if (increase > 5 * 1024 * 1024) {
      }
    }, 10000); // Check after 10 seconds
  }
};

export default PerformanceMonitor;
