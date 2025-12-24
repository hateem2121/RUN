import { useCallback, useEffect, useMemo, useState } from "react";

interface ViewportDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
}

interface PositionConstraints {
  minMargin: number;
  maxContentWidth: number;
  maxContentHeight: number;
  preferredPosition: "center" | "top" | "bottom";
  nestingLevel: number;
  contentType: "default" | "media-library" | "form" | "fullscreen";
}

interface PositionResult {
  x: number;
  y: number;
  maxWidth: number;
  maxHeight: number;
  transform: string;
  isConstrainedByViewport: boolean;
  suggestedSize: {
    width: string;
    height: string;
  };
}

interface ModalBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

/**
 * Enhanced viewport-aware positioning hook for modal dialogs
 * Optimizes positioning calculations and handles cross-device scenarios
 */
export function useViewportAwarePositioning() {
  const [viewport, setViewport] = useState<ViewportDimensions>({
    width: 1024,
    height: 768,
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1,
  });

  // Debounced viewport update to prevent excessive recalculations
  const updateViewport = useCallback(() => {
    if (typeof window === "undefined") return;

    const newViewport: ViewportDimensions = {
      width: window.outerWidth,
      height: window.outerHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    };

    setViewport((prev) => {
      // Only update if there's a meaningful change (prevents unnecessary re-renders)
      const widthChanged = Math.abs(prev.innerWidth - newViewport.innerWidth) > 10;
      const heightChanged = Math.abs(prev.innerHeight - newViewport.innerHeight) > 10;

      if (widthChanged || heightChanged) {
        return newViewport;
      }
      return prev;
    });
  }, []);

  // Optimized event listeners with passive options for better performance
  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout;

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewport, 100);
    };

    const handleOrientationChange = () => {
      // Delay to allow orientation change to complete
      setTimeout(updateViewport, 300);
    };

    // Use passive listeners for better performance
    window.addEventListener("resize", debouncedUpdate, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, {
      passive: true,
    });

    // Visual viewport API for better mobile support
    if ("visualViewport" in window) {
      window.visualViewport?.addEventListener("resize", debouncedUpdate, {
        passive: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("orientationchange", handleOrientationChange);

      if ("visualViewport" in window) {
        window.visualViewport?.removeEventListener("resize", debouncedUpdate);
      }
    };
  }, [updateViewport]);

  // Device type detection for optimized positioning strategies
  const deviceType = useMemo(() => {
    const { innerWidth } = viewport;

    if (innerWidth <= 480) return "mobile";
    if (innerWidth <= 768) return "tablet";
    if (innerWidth <= 1024) return "laptop";
    return "desktop";
  }, [viewport]);

  // Optimized safe area calculation for modern devices
  const safeArea = useMemo(() => {
    if (typeof window === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };

    const computedStyle = getComputedStyle(document.documentElement);

    return {
      top: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-top)") || "0", 10),
      right: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-right)") || "0", 10),
      bottom: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-bottom)") || "0", 10),
      left: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-left)") || "0", 10),
    };
  }, []);

  /**
   * Calculate optimal modal bounds considering viewport constraints
   */
  const calculateModalBounds = useCallback(
    (constraints: PositionConstraints): ModalBounds => {
      const { innerWidth, innerHeight } = viewport;
      const { minMargin, nestingLevel } = constraints;

      // Adaptive margins based on device type and nesting level
      const adaptiveMargin = Math.max(
        minMargin,
        deviceType === "mobile" ? 16 : deviceType === "tablet" ? 24 : 32,
      );

      // Nesting offset calculation with collision detection
      const nestingOffset = nestingLevel * (deviceType === "mobile" ? 8 : 20);

      const effectiveMargin = adaptiveMargin + nestingOffset + safeArea.left;
      const topMargin = adaptiveMargin + nestingOffset + safeArea.top;
      const bottomMargin = adaptiveMargin + safeArea.bottom;
      const rightMargin = adaptiveMargin + safeArea.right;

      return {
        left: effectiveMargin,
        top: topMargin,
        right: innerWidth - rightMargin,
        bottom: innerHeight - bottomMargin,
        centerX: innerWidth / 2,
        centerY: innerHeight / 2,
      };
    },
    [viewport, deviceType, safeArea],
  );

  /**
   * Calculate optimal modal size based on content type and viewport
   */
  const calculateOptimalSize = useCallback(
    (constraints: PositionConstraints, bounds: ModalBounds) => {
      const { contentType, maxContentWidth, maxContentHeight } = constraints;
      const availableWidth = bounds.right - bounds.left;
      const availableHeight = bounds.bottom - bounds.top;

      // Content-type specific size calculations
      let optimalWidth: number;
      let optimalHeight: number;

      switch (contentType) {
        case "fullscreen":
          optimalWidth = Math.min(availableWidth * 0.95, maxContentWidth);
          optimalHeight = Math.min(availableHeight * 0.95, maxContentHeight);
          break;

        case "media-library":
          // Media library needs more space for grids and previews
          if (deviceType === "mobile") {
            optimalWidth = availableWidth * 0.95;
            optimalHeight = availableHeight * 0.9;
          } else {
            optimalWidth = Math.min(availableWidth * 0.85, Math.max(800, maxContentWidth));
            optimalHeight = Math.min(availableHeight * 0.85, Math.max(600, maxContentHeight));
          }
          break;

        case "form":
          // Forms need comfortable reading width
          if (deviceType === "mobile") {
            optimalWidth = availableWidth * 0.95;
            optimalHeight = Math.min(availableHeight * 0.8, maxContentHeight);
          } else {
            optimalWidth = Math.min(availableWidth * 0.6, Math.max(480, maxContentWidth));
            optimalHeight = Math.min(availableHeight * 0.8, maxContentHeight);
          }
          break;

        default: {
          // Default modal sizing with responsive scaling
          const baseWidth = deviceType === "mobile" ? 320 : deviceType === "tablet" ? 400 : 480;
          optimalWidth = Math.min(availableWidth * 0.9, Math.max(baseWidth, maxContentWidth));
          optimalHeight = Math.min(availableHeight * 0.8, maxContentHeight);
          break;
        }
      }

      return {
        width: Math.floor(optimalWidth),
        height: Math.floor(optimalHeight),
      };
    },
    [deviceType],
  );

  /**
   * Calculate optimal position with collision detection and viewport constraints
   */
  const calculateOptimalPosition = useCallback(
    (
      constraints: PositionConstraints,
      contentSize: { width: number; height: number },
    ): PositionResult => {
      const bounds = calculateModalBounds(constraints);
      const { width: contentWidth, height: contentHeight } = contentSize;

      // Calculate base position (centered)
      let x = bounds.centerX;
      let y = bounds.centerY;

      // Apply preferred positioning with viewport constraints
      switch (constraints.preferredPosition) {
        case "top":
          y = bounds.top + contentHeight / 2 + 60; // Header offset
          break;
        case "bottom":
          y = bounds.bottom - contentHeight / 2 - 60; // Footer offset
          break;
        default:
          // Keep center position
          break;
      }

      // Collision detection and viewport constraint handling
      const leftBound = bounds.left + contentWidth / 2;
      const rightBound = bounds.right - contentWidth / 2;
      const topBound = bounds.top + contentHeight / 2;
      const bottomBound = bounds.bottom - contentHeight / 2;

      // Constrain to viewport bounds
      x = Math.max(leftBound, Math.min(x, rightBound));
      y = Math.max(topBound, Math.min(y, bottomBound));

      // Check if modal was constrained by viewport
      const isConstrainedByViewport =
        x !== bounds.centerX ||
        y !== (constraints.preferredPosition === "center" ? bounds.centerY : y);

      // Generate optimized transform with GPU acceleration
      const nestingOffset = constraints.nestingLevel * (deviceType === "mobile" ? 8 : 20);
      const transform = `translate(-50%, -50%) translate(${nestingOffset}px, ${nestingOffset}px) translateZ(0)`;

      // Calculate maximum available space
      const maxWidth = Math.min(bounds.right - bounds.left, constraints.maxContentWidth);
      const maxHeight = Math.min(bounds.bottom - bounds.top, constraints.maxContentHeight);

      // Generate responsive size suggestions
      const suggestedSize = {
        width:
          contentWidth > maxWidth ? `min(${maxWidth}px, 95vw)` : `min(${contentWidth}px, 95vw)`,
        height:
          contentHeight > maxHeight ? `min(${maxHeight}px, 95vh)` : `min(${contentHeight}px, 95vh)`,
      };

      return {
        x: Math.floor(x),
        y: Math.floor(y),
        maxWidth: Math.floor(maxWidth),
        maxHeight: Math.floor(maxHeight),
        transform,
        isConstrainedByViewport,
        suggestedSize,
      };
    },
    [calculateModalBounds, deviceType],
  );

  /**
   * Main positioning calculation function with optimized performance
   */
  const calculatePosition = useCallback(
    (constraints: PositionConstraints): PositionResult => {
      const bounds = calculateModalBounds(constraints);
      const optimalSize = calculateOptimalSize(constraints, bounds);

      return calculateOptimalPosition(constraints, optimalSize);
    },
    [calculateModalBounds, calculateOptimalSize, calculateOptimalPosition],
  );

  /**
   * Get device-optimized modal classes for better styling
   */
  const getDeviceOptimizedClasses = useCallback(() => {
    const baseClasses = ["viewport-optimized-modal"];

    baseClasses.push(`device-${deviceType}`);

    if (viewport.devicePixelRatio > 1) {
      baseClasses.push("high-dpi");
    }

    if (viewport.innerHeight < 600) {
      baseClasses.push("constrained-height");
    }

    if (viewport.innerWidth < 400) {
      baseClasses.push("narrow-viewport");
    }

    return baseClasses;
  }, [deviceType, viewport]);

  /**
   * Check if device supports advanced positioning features
   */
  const supportsAdvancedPositioning = useMemo(() => {
    if (typeof window === "undefined") return false;

    return {
      visualViewport: "visualViewport" in window,
      intersectionObserver: "IntersectionObserver" in window,
      resizeObserver: "ResizeObserver" in window,
      cssCustomProperties: CSS.supports("(--custom: value)"),
      transform3d: CSS.supports("transform", "translate3d(0,0,0)"),
    };
  }, []);

  return {
    viewport,
    deviceType,
    safeArea,
    calculatePosition,
    getDeviceOptimizedClasses,
    supportsAdvancedPositioning,
    isReady: viewport.innerWidth > 0 && viewport.innerHeight > 0,
  };
}

/**
 * Hook for managing modal positioning with automatic updates
 */
export function useModalPositioning(
  isOpen: boolean,
  constraints: PositionConstraints,
  dependencies: React.DependencyList = [],
) {
  const { calculatePosition, isReady, ...positioning } = useViewportAwarePositioning();

  const position = useMemo(() => {
    if (!isOpen || !isReady) {
      return null;
    }

    return calculatePosition(constraints);
  }, [isOpen, isReady, calculatePosition, constraints, ...dependencies]);

  return {
    position,
    isReady,
    ...positioning,
  };
}
