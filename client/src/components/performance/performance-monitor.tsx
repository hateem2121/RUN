/**
 * Phase 3: Performance Monitoring System
 * Comprehensive performance tracking for animation components
 */

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimationErrorBoundary } from "@/components/error-boundaries/animation-error-boundary";

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  memoryUsage: number;
  animationFPS: number;
  gsapInstances: number;
  scrollTriggerInstances: number;
  errorCount: number;
  lastUpdated: number;
}

interface PerformanceThresholds {
  maxRenderTime: number;
  maxMemoryUsage: number;
  minAnimationFPS: number;
  maxGsapInstances: number;
  maxErrorCount: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 16, // 60 FPS threshold
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  minAnimationFPS: 55, // Minimum acceptable FPS
  maxGsapInstances: 10, // Maximum GSAP instances
  maxErrorCount: 3, // Maximum errors before warning
};

interface PerformanceMonitorProps {
  componentName: string;
  enabled?: boolean;
  thresholds?: Partial<PerformanceThresholds>;
  onPerformanceAlert?: (metric: string, value: number, threshold: number) => void;
  children?: React.ReactNode;
}

function PerformanceMonitorComponent({
  componentName,
  enabled = true,
  thresholds = {},
  onPerformanceAlert,
  children,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    componentName,
    renderTime: 0,
    memoryUsage: 0,
    animationFPS: 60,
    gsapInstances: 0,
    scrollTriggerInstances: 0,
    errorCount: 0,
    lastUpdated: 0, // Deterministic initial state
  });

  const renderStartTime = useRef<number>(0);
  const frameCounter = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const animationId = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Phase 3: Performance Tracking - Render Time Measurement
  const startRenderMeasurement = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  const endRenderMeasurement = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;

    // Alert on slow renders
    if (renderTime > finalThresholds.maxRenderTime && onPerformanceAlert) {
      onPerformanceAlert("renderTime", renderTime, finalThresholds.maxRenderTime);
    }

    setMetrics((prev) => ({
      ...prev,
      renderTime,
      lastUpdated: Date.now(),
    }));

    renderStartTime.current = 0;
  }, [enabled, finalThresholds.maxRenderTime, onPerformanceAlert]);

  // Phase 3: Memory Usage Monitoring
  const measureMemoryUsage = useCallback(() => {
    if (!enabled || !("memory" in performance)) return;

    const memory = (performance as any).memory;
    const memoryUsage = memory?.usedJSHeapSize || 0;

    // Alert on high memory usage
    if (memoryUsage > finalThresholds.maxMemoryUsage && onPerformanceAlert) {
      onPerformanceAlert("memoryUsage", memoryUsage, finalThresholds.maxMemoryUsage);
    }

    setMetrics((prev) => ({
      ...prev,
      memoryUsage,
      lastUpdated: Date.now(),
    }));
  }, [enabled, finalThresholds.maxMemoryUsage, onPerformanceAlert]);

  // Phase 3: Animation FPS Monitoring
  const measureAnimationFPS = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();

    if (lastFrameTime.current !== 0) {
      const deltaTime = now - lastFrameTime.current;
      const fps = 1000 / deltaTime;

      frameCounter.current++;

      // Update FPS every 10 frames for stability
      if (frameCounter.current >= 10) {
        // Alert on low FPS
        if (fps < finalThresholds.minAnimationFPS && onPerformanceAlert) {
          onPerformanceAlert("animationFPS", fps, finalThresholds.minAnimationFPS);
        }

        setMetrics((prev) => ({
          ...prev,
          animationFPS: Math.round(fps),
          lastUpdated: Date.now(),
        }));

        frameCounter.current = 0;
      }
    }

    lastFrameTime.current = now;
    animationId.current = requestAnimationFrame(measureAnimationFPS);
  }, [enabled, finalThresholds.minAnimationFPS, onPerformanceAlert]);

  // Phase 3: GSAP Instance Monitoring
  const measureGSAPInstances = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    let gsapInstances = 0;
    let scrollTriggerInstances = 0;

    // Count GSAP instances
    if (window.gsap?.globalTimeline) {
      const timeline = window.gsap.globalTimeline;
      gsapInstances = timeline.getChildren ? timeline.getChildren().length : 0;
    }

    // Count ScrollTrigger instances
    if (window.ScrollTrigger?.getAll) {
      scrollTriggerInstances = window.ScrollTrigger.getAll().length;
    }

    // Alert on too many instances
    if (gsapInstances > finalThresholds.maxGsapInstances && onPerformanceAlert) {
      onPerformanceAlert("gsapInstances", gsapInstances, finalThresholds.maxGsapInstances);
    }

    setMetrics((prev) => ({
      ...prev,
      gsapInstances,
      scrollTriggerInstances,
      lastUpdated: Date.now(),
    }));
  }, [enabled, finalThresholds.maxGsapInstances, onPerformanceAlert]);

  // Phase 3: Error Count Tracking
  const incrementErrorCount = useCallback(() => {
    if (!enabled) return;

    errorCountRef.current++;

    // Alert on high error count
    if (errorCountRef.current > finalThresholds.maxErrorCount && onPerformanceAlert) {
      onPerformanceAlert("errorCount", errorCountRef.current, finalThresholds.maxErrorCount);
    }

    setMetrics((prev) => ({
      ...prev,
      errorCount: errorCountRef.current,
      lastUpdated: Date.now(),
    }));
  }, [enabled, finalThresholds.maxErrorCount, onPerformanceAlert]);

  // Phase 3: Performance Monitoring Lifecycle
  useEffect(() => {
    if (!enabled) return;

    // Start render measurement
    startRenderMeasurement();

    // Start FPS monitoring
    animationId.current = requestAnimationFrame(measureAnimationFPS);

    // Set up periodic measurements
    const memoryInterval = setInterval(measureMemoryUsage, 2000); // Every 2 seconds
    const gsapInterval = setInterval(measureGSAPInstances, 5000); // Every 5 seconds

    // Global error handler for this component
    const errorHandler = (event: ErrorEvent) => {
      if (event.error?.stack?.includes(componentName)) {
        incrementErrorCount();
      }
    };

    window.addEventListener("error", errorHandler);

    // Cleanup on unmount
    return () => {
      endRenderMeasurement();

      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }

      clearInterval(memoryInterval);
      clearInterval(gsapInterval);
      window.removeEventListener("error", errorHandler);
    };
  }, [
    enabled,
    componentName,
    startRenderMeasurement,
    endRenderMeasurement,
    measureAnimationFPS,
    measureMemoryUsage,
    measureGSAPInstances,
    incrementErrorCount,
  ]);

  // Phase 3: Performance Metrics Logging
  useEffect(() => {
    if (!enabled) return;
  }, [enabled]);

  // Phase 3: Render the monitored component
  useEffect(() => {
    // End render measurement after render completes
    endRenderMeasurement();
  });

  // Expose metrics for external access
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.performanceMetrics) {
        window.performanceMetrics = {};
      }
      window.performanceMetrics[componentName] = metrics;
    }
  }, [componentName, metrics]);

  return (
    <>
      {children}
      {enabled && process.env.NODE_ENV === "development" && (
        <div className="fixed right-2 bottom-2 z-dock rounded bg-black/80 p-2 font-mono text-white text-xs">
          <div className="font-bold text-green-400">🔍 {componentName}</div>
          <div>Render: {metrics.renderTime.toFixed(1)}ms</div>
          <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
          <div>FPS: {metrics.animationFPS}</div>
          <div>GSAP: {metrics.gsapInstances}</div>
          <div>ST: {metrics.scrollTriggerInstances}</div>
          {metrics.errorCount > 0 && (
            <div className="text-red-400">Errors: {metrics.errorCount}</div>
          )}
        </div>
      )}
    </>
  );
}

// Export wrapped component with enhanced error boundary protection
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = (props) => {
  return (
    <AnimationErrorBoundary componentName="PerformanceMonitor">
      <PerformanceMonitorComponent {...props} />
    </AnimationErrorBoundary>
  );
};

// Performance metrics interface for external access
declare global {
  interface Window {
    performanceMetrics: Record<string, PerformanceMetrics>;
  }
}
