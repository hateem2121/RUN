/**
 * PHASE 1: Performance-Optimized Intersection Observer
 * Smart animation scheduling and viewport-based rendering
 */

import React, { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface IntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  triggerOnce?: boolean;
  skip?: boolean;
}

interface IntersectionResult {
  isIntersecting: boolean;
  hasIntersected: boolean;
  entry?: IntersectionObserverEntry;
}

// Global intersection observer manager for performance
class IntersectionManager {
  private observers = new Map<string, IntersectionObserver>();
  private callbacks = new Map<Element, Set<(entry: IntersectionObserverEntry) => void>>();

  getObserver(options: IntersectionOptions): IntersectionObserver {
    const key = JSON.stringify(options);

    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const callbacks = this.callbacks.get(entry.target);
          if (callbacks) {
            callbacks.forEach((callback) => {
              callback(entry);
            });
          }
        });
      }, options);

      this.observers.set(key, observer);
    }

    return this.observers.get(key)!;
  }

  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionOptions,
  ): () => void {
    const observer = this.getObserver(options);

    if (!this.callbacks.has(element)) {
      this.callbacks.set(element, new Set());
      observer.observe(element);
    }

    this.callbacks.get(element)?.add(callback);

    // Return cleanup function
    return () => {
      const callbacks = this.callbacks.get(element);
      if (callbacks) {
        callbacks.delete(callback);

        if (callbacks.size === 0) {
          observer.unobserve(element);
          this.callbacks.delete(element);
        }
      }
    };
  }

  disconnect() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    this.callbacks.clear();
  }
}

const intersectionManager = new IntersectionManager();

// Performance-optimized intersection observer hook
export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  options: IntersectionOptions = {},
): IntersectionResult {
  const {
    threshold = 0.1,
    rootMargin = "50px",
    root = null,
    triggerOnce = true,
    skip = false,
  } = options;

  const observerOptions = useMemo(
    () => ({
      threshold,
      rootMargin,
      root,
    }),
    [threshold, rootMargin, root],
  );

  const [result, setResult] = useState<IntersectionResult>({
    isIntersecting: false,
    hasIntersected: false,
  });

  const handleIntersection = useCallback(
    (entry: IntersectionObserverEntry) => {
      const isIntersecting = entry.isIntersecting;

      setResult((prev) => {
        const hasIntersected = prev.hasIntersected || isIntersecting;

        // If triggerOnce is true and we've already intersected, don't update
        if (triggerOnce && prev.hasIntersected && !isIntersecting) {
          return prev;
        }

        return {
          isIntersecting,
          hasIntersected,
          entry,
        };
      });
    },
    [triggerOnce],
  );

  useEffect(() => {
    const element = ref.current;

    if (!element || skip) {
      return;
    }

    const cleanup = intersectionManager.observe(element, handleIntersection, observerOptions);

    return cleanup;
  }, [ref, handleIntersection, observerOptions, skip]);

  return result;
}

// Animation-aware intersection observer
export function useAnimationIntersectionObserver(
  ref: RefObject<Element | null>,
  options: IntersectionOptions & {
    animationDelay?: number;
    enableAnimations?: boolean;
  } = {},
): IntersectionResult & {
  shouldAnimate: boolean;
  animationDelay: number;
} {
  const { animationDelay = 0, enableAnimations = true, ...intersectionOptions } = options;
  const intersectionResult = useIntersectionObserver(ref, intersectionOptions);

  const shouldAnimate = useMemo(() => {
    return (
      enableAnimations && (intersectionResult.isIntersecting || intersectionResult.hasIntersected)
    );
  }, [enableAnimations, intersectionResult.isIntersecting, intersectionResult.hasIntersected]);

  return {
    ...intersectionResult,
    shouldAnimate,
    animationDelay,
  };
}

// Performance-optimized image loading intersection observer
export function useImageIntersectionObserver(
  ref: RefObject<HTMLImageElement | null>,
  options: IntersectionOptions & {
    preloadThreshold?: number;
  } = {},
): IntersectionResult & {
  shouldLoad: boolean;
  shouldPreload: boolean;
} {
  const { preloadThreshold = 0.1, ...intersectionOptions } = options;

  const intersectionResult = useIntersectionObserver(ref, {
    ...intersectionOptions,
    rootMargin: options.rootMargin || "100px", // Load images before they're visible
  });

  const shouldLoad = intersectionResult.isIntersecting || intersectionResult.hasIntersected;
  const shouldPreload = (intersectionResult.entry?.intersectionRatio || 0) >= preloadThreshold;

  return {
    ...intersectionResult,
    shouldLoad,
    shouldPreload,
  };
}

// Batch intersection observer for multiple elements
export function useBatchIntersectionObserver<T extends Element>(
  refs: RefObject<T | null>[],
  options: IntersectionOptions = {},
): Map<RefObject<T | null>, IntersectionResult> {
  const [results, setResults] = useState(new Map<RefObject<T | null>, IntersectionResult>());

  const observerOptions = useMemo(
    () => ({
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || "50px",
      root: options.root || null,
    }),
    [options.threshold, options.rootMargin, options.root],
  );

  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    refs.forEach((ref) => {
      const element = ref.current;
      if (!element) {
        return;
      }

      const handleIntersection = (entry: IntersectionObserverEntry) => {
        setResults((prev) => {
          const newResults = new Map(prev);
          const currentResult = newResults.get(ref) || {
            isIntersecting: false,
            hasIntersected: false,
          };

          newResults.set(ref, {
            isIntersecting: entry.isIntersecting,
            hasIntersected: currentResult.hasIntersected || entry.isIntersecting,
            entry,
          });

          return newResults;
        });
      };

      const cleanup = intersectionManager.observe(element, handleIntersection, observerOptions);
      cleanupFunctions.push(cleanup);
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [refs, observerOptions]);

  return results;
}

// Smart animation scheduler
export function useSmartAnimationScheduler(
  isVisible: boolean,
  animationConfig: {
    staggerDelay?: number;
    maxConcurrent?: number;
    priority?: "high" | "medium" | "low";
  } = {},
) {
  const { staggerDelay = 100, priority = "medium" } = animationConfig;
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [animationIndex, setAnimationIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const baseDelay = priority === "high" ? 0 : priority === "medium" ? 50 : 100;
    const totalDelay = baseDelay + animationIndex * staggerDelay;

    const timeoutId = setTimeout(() => {
      setShouldAnimate(true);
    }, totalDelay);

    return () => clearTimeout(timeoutId);
  }, [isVisible, animationIndex, staggerDelay, priority]);

  const registerAnimation = useCallback(() => {
    setAnimationIndex((prev) => prev + 1);
  }, []);

  return {
    shouldAnimate,
    registerAnimation,
    animationIndex,
  };
}

// Device capability detection hook
function useDeviceCapabilities() {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        isLowEnd: false,
        isMobile: false,
        supportsIntersectionObserver: false,
        supportsWebGL: false,
        deviceMemory: 4,
        hardwareConcurrency: 4,
      };
    }

    type NavigatorWithMemory = Navigator & { deviceMemory?: number };
    const navigator = window.navigator as NavigatorWithMemory;
    const deviceMemory = navigator.deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    const isLowEnd = deviceMemory < 4 || hardwareConcurrency < 4;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

    // Check WebGL support
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    const supportsWebGL = !!gl;

    return {
      isLowEnd,
      isMobile,
      supportsIntersectionObserver: "IntersectionObserver" in window,
      supportsWebGL,
      deviceMemory,
      hardwareConcurrency,
    };
  }, []);
}

// Performance-aware component wrapper with generic prop preservation
export function withPerformanceOptimization<P extends Record<string, unknown> = Record<string, unknown>>(
  Component: React.ComponentType<P>,
  options: {
    lazyThreshold?: number;
    disableOnLowEnd?: boolean;
    fallbackComponent?: React.ComponentType<P>;
  } = {},
): React.ComponentType<P> {
  const { lazyThreshold = 0.1, disableOnLowEnd = false, fallbackComponent: Fallback } = options;

  const WrappedComponent: React.FC<P> = (props: P) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { isLowEnd } = useDeviceCapabilities();
    const { hasIntersected } = useIntersectionObserver(containerRef, {
      threshold: lazyThreshold,
      triggerOnce: true,
    });

    // Use fallback for low-end devices if specified
    if (disableOnLowEnd && isLowEnd && Fallback) {
      return React.createElement(Fallback, props);
    }

    // Only render when intersected
    if (!hasIntersected) {
      return React.createElement("div", {
        ref: containerRef,
        className: "min-h-custom-space-280",
      });
    }

    return React.createElement("div", { ref: containerRef }, React.createElement(Component, props));
  };

  WrappedComponent.displayName = `WithPerformanceOptimization(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
}

// Cleanup on unmount
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    intersectionManager.disconnect();
  });
}
