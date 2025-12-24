/**
 * Phase 3: Animation Performance Tracker
 * Specialized performance tracking for GSAP animations
 */

import { useCallback, useEffect, useRef } from "react";

interface AnimationPerformanceMetrics {
  componentName: string;
  animationStart: number;
  animationDuration: number;
  frameDrops: number;
  averageFPS: number;
  peakMemoryUsage: number;
  gsapComplexity: number;
  scrollTriggerEvents: number;
}

interface AnimationPerformanceTrackerProps {
  componentName: string;
  enabled?: boolean;
  onMetricsUpdate?: (metrics: AnimationPerformanceMetrics) => void;
}

export function AnimationPerformanceTracker({
  componentName,
  enabled = true,
  onMetricsUpdate,
}: AnimationPerformanceTrackerProps) {
  const metrics = useRef<AnimationPerformanceMetrics>({
    componentName,
    animationStart: 0,
    animationDuration: 0,
    frameDrops: 0,
    averageFPS: 60,
    peakMemoryUsage: 0,
    gsapComplexity: 0,
    scrollTriggerEvents: 0,
  });

  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const frameTimes = useRef<number[]>([]);
  const animationId = useRef<number>(0);
  const initialMemory = useRef<number>(0);

  // Phase 3: Track Animation Start
  const startTracking = useCallback(() => {
    if (!enabled) return;

    metrics.current.animationStart = performance.now();
    frameCount.current = 0;
    frameTimes.current = [];

    // Record initial memory usage
    if ("memory" in performance) {
      initialMemory.current = (performance as any).memory?.usedJSHeapSize || 0;
    }
  }, [enabled]);

  // Phase 3: Track Animation Frame
  const trackFrame = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();

    if (lastFrameTime.current !== 0) {
      const frameTime = now - lastFrameTime.current;
      frameTimes.current.push(frameTime);

      // Detect frame drops (>16.67ms = below 60fps)
      if (frameTime > 16.67) {
        metrics.current.frameDrops++;
      }

      frameCount.current++;

      // Calculate average FPS every 30 frames
      if (frameCount.current % 30 === 0) {
        const avgFrameTime =
          frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
        metrics.current.averageFPS = Math.round(1000 / avgFrameTime);

        // Clear frame times to prevent memory buildup
        frameTimes.current = frameTimes.current.slice(-30);
      }
    }

    lastFrameTime.current = now;
    animationId.current = requestAnimationFrame(trackFrame);
  }, [enabled]);

  // Phase 3: Track Memory Usage
  const trackMemoryUsage = useCallback(() => {
    if (!enabled || !("memory" in performance)) return;

    const memory = (performance as any).memory;
    const currentMemory = memory?.usedJSHeapSize || 0;

    if (currentMemory > metrics.current.peakMemoryUsage) {
      metrics.current.peakMemoryUsage = currentMemory;
    }
  }, [enabled]);

  // Phase 3: Track GSAP Complexity
  const trackGSAPComplexity = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    let complexity = 0;

    // Count active tweens
    if (window.gsap?.globalTimeline) {
      const timeline = window.gsap.globalTimeline;
      const children = timeline.getChildren ? timeline.getChildren() : [];
      complexity += children.length;

      // Add complexity for nested timelines
      children.forEach((child: any) => {
        if (child.getChildren) {
          complexity += child.getChildren().length * 0.5; // Nested tweens add less complexity
        }
      });
    }

    metrics.current.gsapComplexity = complexity;
  }, [enabled]);

  // Phase 3: Track ScrollTrigger Events
  const trackScrollTriggerEvents = useCallback(() => {
    if (!enabled || typeof window === "undefined" || !window.ScrollTrigger) return;

    const triggers = window.ScrollTrigger.getAll ? window.ScrollTrigger.getAll() : [];
    metrics.current.scrollTriggerEvents = triggers.length;
  }, [enabled]);

  // Phase 3: Stop Tracking and Calculate Final Metrics
  const stopTracking = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();
    metrics.current.animationDuration = now - metrics.current.animationStart;

    // Calculate memory growth
    if ("memory" in performance && initialMemory.current) {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = currentMemory - initialMemory.current;
      metrics.current.peakMemoryUsage = Math.max(metrics.current.peakMemoryUsage, memoryGrowth);
    }

    // Final complexity and event tracking
    trackGSAPComplexity();
    trackScrollTriggerEvents();

    // Report metrics
    if (onMetricsUpdate) {
      onMetricsUpdate({ ...metrics.current });
    }

    // Stop frame tracking
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
    }
  }, [enabled, trackGSAPComplexity, trackScrollTriggerEvents, onMetricsUpdate]);

  // Phase 3: Setup Performance Tracking
  useEffect(() => {
    if (!enabled) return;

    // Start tracking
    startTracking();

    // Begin frame tracking
    animationId.current = requestAnimationFrame(trackFrame);

    // Setup periodic memory and complexity tracking
    const memoryInterval = setInterval(trackMemoryUsage, 1000);
    const complexityInterval = setInterval(trackGSAPComplexity, 2000);

    // Cleanup on unmount
    return () => {
      stopTracking();
      clearInterval(memoryInterval);
      clearInterval(complexityInterval);
    };
  }, [enabled, startTracking, trackFrame, trackMemoryUsage, trackGSAPComplexity, stopTracking]);

  // Phase 3: Expose tracking methods for external control
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.animationTrackers) {
        window.animationTrackers = {};
      }

      window.animationTrackers[componentName] = {
        start: startTracking,
        stop: stopTracking,
        getMetrics: () => ({ ...metrics.current }),
      };
    }
  }, [componentName, startTracking, stopTracking]);

  return null; // This is a tracking component, no UI
}

// Global interface for animation trackers
declare global {
  interface Window {
    animationTrackers: Record<
      string,
      {
        start: () => void;
        stop: () => void;
        getMetrics: () => AnimationPerformanceMetrics;
      }
    >;
  }
}
