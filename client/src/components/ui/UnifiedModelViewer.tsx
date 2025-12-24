import type { MediaAsset } from "@shared/schema";
import { AlertCircle, Box, Download, Loader2, Play, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ModelViewerErrorBoundary } from "@/components/ui/ModelViewerErrorBoundary";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { useModelViewerErrorRecovery } from "@/hooks/use-model-viewer-error-recovery";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import {
  getErrorConfig,
  getModelViewerConfig,
  MODEL_VIEWER_ENVIRONMENT,
  type ModelViewerConfig,
} from "@/lib/model-viewer-config";
import { ensureModelViewerLoaded } from "@/lib/model-viewer-loader";
import { batchFetchMediaContent } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Type definitions for model-viewer and browser APIs
type ModelViewerEvent = {
  detail?: {
    totalProgress?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
};

type WindowWithGC = typeof window & {
  gc?: () => void;
};

// Enhanced loading state for comprehensive tracking
interface LoadingState {
  status: "idle" | "initializing" | "loading" | "loaded" | "error";
  progress: number;
  bytesLoaded?: number;
  totalBytes?: number;
  errorMessage?: string;
  retryCount: number;
  startTime: number;
}

export interface UnifiedModelViewerProps {
  asset: MediaAsset;
  className?: string;
  config?: ModelViewerConfig;
  showControls?: boolean;
  showLoadingProgress?: boolean;
  showFileInfo?: boolean;
  onLoad?: (asset: MediaAsset) => void;
  onError?: (error: Error, asset: MediaAsset) => void;
  onInteraction?: (type: string, data?: unknown) => void;
}

export default function UnifiedModelViewer({
  asset,
  className,
  config = {},
  showControls = true,
  showLoadingProgress = true,
  showFileInfo = false,
  onLoad,
  onError,
  onInteraction,
}: Readonly<UnifiedModelViewerProps>) {
  // Error boundary integration - MUST be declared before any early returns
  const { errorBoundaryKey } = useModelViewerErrorRecovery();

  // Mobile detection for performance optimization
  const { isMobile } = useMobileDetection();

  // Central configuration system
  const finalConfig = getModelViewerConfig(config);
  const errorConfig = getErrorConfig();

  // Let @google/model-viewer handle embedded textures naturally with CSP blob: URL support

  // State management
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: "idle",
    progress: 0,
    retryCount: 0,
    startTime: 0, // Deterministic initial state for SSR safety
  });

  const [isModelViewerReady, setIsModelViewerReady] = useState(false);
  const [webglLost, setWebglLost] = useState(false);
  const [shouldLoadModel, setShouldLoadModel] = useState(finalConfig.loading !== "lazy");
  const [retryTimeouts, setRetryTimeouts] = useState<number[]>([]);
  const [memoryMonitorActive, setMemoryMonitorActive] = useState(false);
  const [, setPerformanceMetrics] = useState<any>({});
  const [, setLastWebGLMemoryCheck] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(finalConfig.loading !== "lazy");

  const [userActivated, setUserActivated] = useState(
    finalConfig.loading === "auto" && finalConfig.cameraControls,
  );

  // State for cached GLTF content management
  const [cachedModelBlob, setCachedModelBlob] = useState<string | null>(null);
  const [optimizedModelUrl, setOptimizedModelUrl] = useState<string | null>(null);

  // Refs
  const modelViewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const memoryCleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webglContextRef = useRef<WebGLRenderingContext | null>(null);

  // Error boundary integration (moved after state declarations)
  const handleErrorBoundaryError = useCallback(
    (error: Error, _errorInfo: React.ErrorInfo, asset?: MediaAsset) => {
      if (MODEL_VIEWER_ENVIRONMENT.logging.enableErrorReporting) {
      }

      // Forward to parent error handler
      onError?.(error, asset || ({} as MediaAsset));
    },
    [onError],
  );

  const handleErrorBoundaryRecovery = useCallback(
    (asset?: MediaAsset) => {
      if (MODEL_VIEWER_ENVIRONMENT.logging.enableVerboseLogging) {
      }

      // Implement actual recovery by resetting loading state and model viewer
      setLoadingState((prev) => ({
        ...prev,
        status: "initializing",
        errorMessage: undefined,
        retryCount: 0,
        progress: 0,
      }));

      // Clear any retry timeouts - FIXED: retryTimeouts is state, not ref
      for (const timeout of retryTimeouts) {
        clearTimeout(timeout);
      }
      setRetryTimeouts([]);

      // Reset model viewer if it exists
      if (modelViewerRef.current) {
        try {
          // Clear the source to force a reload
          modelViewerRef.current.src = "";

          // Reset to initial state and reapply src after brief delay
          setTimeout(() => {
            if (modelViewerRef.current && asset) {
              const modelUrl =
                MediaUrlBuilder.buildModelUrlSafe(asset.id, asset) ||
                `/api/media/${asset.id}/content`;

              setLoadingState((prev) => ({ ...prev, status: "loading" }));
              modelViewerRef.current.src = modelUrl; // Reapply the source
            }
          }, 100);
        } catch (error) {}
      }
    },
    [asset, retryTimeouts],
  );

  // Enhanced GLTF file analysis with compression detection
  const analyzeFile = useCallback(() => {
    const sizeInMB = (asset.size || 0) / (1024 * 1024);
    const isGltf =
      asset.originalName?.toLowerCase().endsWith(".gltf") || asset.mimeType?.includes("gltf+json");
    const isGlb =
      asset.originalName?.toLowerCase().endsWith(".glb") || asset.mimeType?.includes("gltf-binary");
    const isLarge = sizeInMB > 20;
    const isVeryLarge = sizeInMB > 50;

    // Smart compression detection for GLB vs GLTF
    const compressionRatio = isGlb ? 0.3 : 0.7; // GLB is typically 70% smaller
    const estimatedDecompressTime = isGlb ? sizeInMB * 0.1 : 0; // GLB decompression overhead

    return {
      sizeInMB: Math.round(sizeInMB * 10) / 10,
      isLarge,
      isVeryLarge,
      isGltf,
      isGlb,
      estimatedLoadTime: Math.ceil(sizeInMB / 2 + estimatedDecompressTime), // Enhanced timing
      compressionRatio,
      supportsProgressiveLoading: !isGlb, // GLB doesn't support progressive due to binary format
      supportsStreaming: isGltf, // GLTF supports streaming, GLB does not
    };
  }, [asset.size, asset.originalName, asset.mimeType]);

  // Error handler with retry logic
  const handleError = useCallback(
    (event: any, context?: string) => {
      const errorDetail = event.detail || {};
      const errorMessage =
        errorDetail.message ||
        errorDetail.type ||
        (event instanceof Error ? event.message : "Model loading failed");

      setLoadingState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: errorMessage,
        progress: 0,
      }));

      onError?.(new Error(errorMessage), asset);
    },
    [asset, onError],
  );

  // Memoized event handlers to prevent unnecessary re-renders
  const handleProgress = useCallback((event: ModelViewerEvent) => {
    const progress = event.detail?.totalProgress || 0;
    setLoadingState((prev) => ({
      ...prev,
      status: "loading",
      progress: Math.round(progress * 100),
    }));
  }, []);

  // Retry with central error configuration
  const handleRetry = useCallback(() => {
    const nextRetryCount = loadingState.retryCount + 1;

    // Check retry limit from central config
    if (nextRetryCount > errorConfig.maxRetries) {
      setLoadingState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: `Maximum retry attempts reached (${nextRetryCount}/${errorConfig.maxRetries})`,
      }));
      return;
    }

    // Clear existing timeouts
    for (const timeout of retryTimeouts) {
      clearTimeout(timeout);
    }
    setRetryTimeouts([]);

    // Use central error config for retry delay
    const delay = errorConfig.retryDelayBase * 2 ** (nextRetryCount - 1);

    setLoadingState((prev) => ({
      ...prev,
      status: "idle",
      progress: 0,
      retryCount: nextRetryCount,
      errorMessage: `Retrying in ${delay / 1000}s... (${nextRetryCount}/${errorConfig.maxRetries})`,
      startTime: Date.now(),
    }));

    // Schedule retry with exponential backoff
    const timeout = setTimeout(() => {
      setLoadingState((prev) => ({
        ...prev,
        errorMessage: undefined,
      }));

      // Force reload the model-viewer by resetting attributes
      if (modelViewerRef.current) {
        const modelViewer = modelViewerRef.current;
        const currentSrc = modelViewer.src;

        // Clean reset of model-viewer state
        modelViewer.removeAttribute("src");
        modelViewer.removeAttribute("camera-controls");
        modelViewer.removeAttribute("auto-rotate");

        // Restore with delay to ensure clean state
        setTimeout(() => {
          if (modelViewerRef.current) {
            modelViewerRef.current.src = currentSrc;
            // CRITICAL FIX: Boolean attributes - only set if true, otherwise remove
            if (finalConfig.cameraControls) {
              modelViewerRef.current.setAttribute("camera-controls", "");
            } else {
              modelViewerRef.current.removeAttribute("camera-controls");
            }

            if (finalConfig.autoRotate) {
              modelViewerRef.current.setAttribute("auto-rotate", "");
            } else {
              modelViewerRef.current.removeAttribute("auto-rotate");
            }
          }
        }, 200);
      }
    }, delay);

    setRetryTimeouts([timeout as unknown as number]);
  }, [loadingState.retryCount, asset.id]); // Remove unstable dependencies

  // MEMORY LEAK FIX: Enhanced WebGL context recovery with aggressive cleanup
  const handleWebGLRecovery = useCallback(() => {
    if (modelViewerRef.current) {
      try {
        // Force immediate memory cleanup before recovery
        forceWebGLMemoryCleanup();

        const currentSrc = modelViewerRef.current.src;
        modelViewerRef.current.src = "";

        // Clear WebGL context reference
        webglContextRef.current = null;

        setTimeout(() => {
          if (modelViewerRef.current) {
            modelViewerRef.current.src = currentSrc;
            setWebglLost(false);
            // Restart memory monitoring after recovery
            startMemoryMonitoring();
          }
        }, 200);
      } catch (error) {
        handleError(error as Error, "WebGL Recovery");
      }
    }
  }, [handleError]);

  // MEMORY LEAK FIX: WebGL memory monitoring and cleanup
  const checkWebGLMemoryUsage = useCallback((): number => {
    if (!modelViewerRef.current || !webglContextRef.current) return 0;

    try {
      const gl = webglContextRef.current;
      gl.getExtension("WEBGL_debug_renderer_info");

      // Estimate memory usage based on WebGL state
      let estimatedMemory = 0;

      // Check texture memory
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      estimatedMemory += (maxTextureSize * maxTextureSize * 4 * maxTextureUnits) / (1024 * 1024); // MB

      // Check buffer memory
      const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      estimatedMemory += maxVertexAttribs * 1; // Rough estimate

      return Math.round(estimatedMemory * 100) / 100; // Round to 2 decimals
    } catch (error) {
      return 0;
    }
  }, []);

  // MEMORY LEAK FIX: Force WebGL context cleanup
  const forceWebGLMemoryCleanup = useCallback(() => {
    if (modelViewerRef.current) {
      try {
        // Get the Shadow DOM canvas
        const canvas = modelViewerRef.current.shadowRoot?.querySelector("canvas");
        if (canvas) {
          const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (gl) {
            // Force garbage collection of WebGL resources
            gl.flush();
            gl.finish();

            // Clear all WebGL state
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          }
        }
      } catch (error) {}
    }
  }, []);

  // MEMORY LEAK FIX: Start memory monitoring
  const startMemoryMonitoring = useCallback(() => {
    if (memoryMonitorActive) return;

    setMemoryMonitorActive(true);

    // Monitor memory every 30 seconds
    memoryCleanupTimerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const webglMemory = checkWebGLMemoryUsage();

      // Check JavaScript heap if available
      let jsHeapUsed = 0;
      if ("memory" in performance) {
        jsHeapUsed = (performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0;
      }

      // Update performance metrics
      setPerformanceMetrics((prev: any) => ({
        ...prev,
        webglMemoryUsage: webglMemory,
        memoryUsage: jsHeapUsed,
        lastMemoryCheck: currentTime,
        memoryGrowthRate: prev.memoryUsage ? jsHeapUsed - prev.memoryUsage : 0,
      }));

      // Memory pressure detection and cleanup
      const MEMORY_PRESSURE_THRESHOLD = 150; // MB
      const JS_HEAP_THRESHOLD = 100 * 1024 * 1024; // 100MB

      if (webglMemory > MEMORY_PRESSURE_THRESHOLD || jsHeapUsed > JS_HEAP_THRESHOLD) {
        forceWebGLMemoryCleanup();

        // Force garbage collection if available
        const windowWithGC = window as WindowWithGC;
        if (windowWithGC.gc) {
          windowWithGC.gc();
        }
      }

      setLastWebGLMemoryCheck(currentTime);
    }, 30000); // Every 30 seconds
  }, [memoryMonitorActive]); // Remove function dependencies that cause re-renders

  // MEMORY LEAK FIX: Stop memory monitoring and cleanup GLTF blobs
  const stopMemoryMonitoring = useCallback(() => {
    if (memoryCleanupTimerRef.current) {
      clearInterval(memoryCleanupTimerRef.current);
      memoryCleanupTimerRef.current = null;
    }

    // SAFE cleanup of cached GLTF blob URLs to prevent memory leaks
    if (cachedModelBlob && cachedModelBlob.startsWith("blob:")) {
      URL.revokeObjectURL(cachedModelBlob);
      setCachedModelBlob(null);
    }
    if (optimizedModelUrl && optimizedModelUrl.startsWith("blob:")) {
      URL.revokeObjectURL(optimizedModelUrl);
      setOptimizedModelUrl(null);
    }

    setMemoryMonitorActive(false);
  }, [cachedModelBlob, optimizedModelUrl]);

  // REMOVED: Data URI compatibility layer that was interfering with @google/model-viewer
  // @google/model-viewer handles embedded textures natively with proper CSP headers

  // Model viewer event handlers
  const setupModelViewerEvents = useCallback(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    // Use memoized progress handler

    // Model loaded successfully with comprehensive performance metrics
    const handleModelLoaded = () => {
      const endTime = Date.now();
      const loadTime = endTime - loadingState.startTime;
      const renderStartTime = performance.now();

      // Update loading state immediately
      setLoadingState((prev) => ({
        ...prev,
        status: "loaded",
        progress: 100,
      }));

      // Measure render time with requestAnimationFrame
      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStartTime;

        // Measure memory usage if available (Chrome/Edge only)
        let memoryUsage: number | undefined;
        let totalMemoryUsage: number | undefined;

        if ("memory" in performance) {
          const memInfo = (performance as PerformanceWithMemory).memory;
          memoryUsage = memInfo?.usedJSHeapSize || 0;
          totalMemoryUsage = memInfo?.totalJSHeapSize || 0;
        }

        // Update comprehensive metrics
        setPerformanceMetrics((prev: any) => ({
          ...prev,
          loadTime,
          renderTime,
          memoryUsage,
          webglContext: true,
          initialRenderTime: renderTime,
          totalMemoryUsage,
        }));

        // CRITICAL FIX: Call callbacks inside requestAnimationFrame to avoid ReferenceError
        onLoad?.(asset);
        onInteraction?.("model-loaded", {
          loadTime,
          renderTime,
          memoryUsage,
          asset,
        });

        // MEMORY LEAK FIX: Start memory monitoring after model loads
        startMemoryMonitoring();

        // Store WebGL context reference for memory management
        const canvas = getCanvas();
        if (canvas) {
          const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (gl) {
            webglContextRef.current = gl;
          }
        }
      });
    };

    // Loading error
    const handleModelError = (event: ModelViewerEvent) => {
      const errorDetail = event.detail;
      const errorMessage =
        typeof errorDetail === "string"
          ? errorDetail
          : typeof errorDetail === "object" && errorDetail
          ? JSON.stringify(errorDetail)
          : "Model loading failed";
      handleError(errorMessage, "Model Loading");
    };

    // WebGL context events
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglLost(true);
    };

    const handleContextRestored = () => {
      setWebglLost(false);
    };

    // Add event listeners using memoized handlers
    modelViewer.addEventListener("progress", handleProgress);
    modelViewer.addEventListener("load", handleModelLoaded);
    modelViewer.addEventListener("error", handleModelError);

    // WebGL context listeners - Fixed for Shadow DOM
    const getCanvas = () => {
      // Try Shadow DOM first (model-viewer uses Shadow DOM internally)
      if (modelViewer.shadowRoot) {
        return modelViewer.shadowRoot.querySelector("canvas");
      }
      // Fallback to regular DOM (though unlikely for model-viewer)
      return modelViewer.querySelector("canvas");
    };

    // Wait for Shadow DOM and canvas to be available
    const attachCanvasListeners = () => {
      const canvas = getCanvas();
      if (canvas) {
        canvas.addEventListener("webglcontextlost", handleContextLost);
        canvas.addEventListener("webglcontextrestored", handleContextRestored);
        return canvas;
      }
      return null;
    };

    // Try immediately, then retry with delay if Shadow DOM not ready
    let canvas = attachCanvasListeners();
    let retryCanvas: NodeJS.Timeout | null = null;

    if (!canvas) {
      // Shadow DOM might not be ready, retry after model-viewer initializes
      retryCanvas = setTimeout(() => {
        canvas = attachCanvasListeners();
        if (!canvas) {
        }
      }, 500);
    }

    // MEMORY LEAK FIX: Enhanced cleanup function with aggressive memory management
    return () => {
      // Clear retry timeout
      if (retryCanvas) {
        clearTimeout(retryCanvas);
      }

      // Stop memory monitoring
      stopMemoryMonitoring();

      // Force immediate WebGL cleanup before removing listeners
      forceWebGLMemoryCleanup();

      modelViewer.removeEventListener("progress", handleProgress);
      modelViewer.removeEventListener("load", handleModelLoaded);
      modelViewer.removeEventListener("error", handleModelError);

      // Clean up WebGL listeners from Shadow DOM
      const currentCanvas = getCanvas();
      if (currentCanvas) {
        currentCanvas.removeEventListener("webglcontextlost", handleContextLost);
        currentCanvas.removeEventListener("webglcontextrestored", handleContextRestored);

        // MEMORY LEAK FIX: Clear WebGL context reference
        webglContextRef.current = null;
      }
    };
  }, [asset.id]); // Only depend on asset.id, not the full asset or callbacks

  // Enhanced GLTF initialization with intelligent caching
  useEffect(() => {
    const initializeModelViewer = async () => {
      try {
        setLoadingState((prev) => ({ ...prev, status: "initializing" }));

        // Attempt to batch fetch GLTF content with caching
        const fileAnalysis = analyzeFile();
        if (asset.id && (fileAnalysis.isGltf || fileAnalysis.isGlb)) {
          try {
            const batchResults = await batchFetchMediaContent([asset.id]);
            const result = batchResults[0];

            if (result?.success && (result.content || result.url)) {
              // Properly handle different content types
              try {
                // Revoke any existing blob URL to prevent memory leaks
                if (cachedModelBlob && cachedModelBlob.startsWith("blob:")) {
                  URL.revokeObjectURL(cachedModelBlob);
                }
                if (optimizedModelUrl && optimizedModelUrl.startsWith("blob:")) {
                  URL.revokeObjectURL(optimizedModelUrl);
                }

                if (result.content) {
                  // Check content type - log first 20 chars for debugging
                  const contentPreview =
                    typeof result.content === "string" ? result.content.slice(0, 20) : "binary";

                  if (typeof result.content === "string") {
                    if (result.content.startsWith("data:")) {
                      // Data URL - fetch to get binary content
                      const response = await fetch(result.content);
                      const arrayBuffer = await response.arrayBuffer();
                      const modelBlob = new Blob([arrayBuffer], {
                        type: fileAnalysis.isGlb ? "model/gltf-binary" : "model/gltf+json",
                      });
                      const blobUrl = URL.createObjectURL(modelBlob);
                      setCachedModelBlob(blobUrl);
                    } else if (result.content.startsWith("http")) {
                      // Regular URL - use directly without creating blob
                      setOptimizedModelUrl(result.content);
                    } else {
                      // Assume base64 - decode and create blob with safety
                      try {
                        const binaryString = atob(result.content);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        const modelBlob = new Blob([bytes], {
                          type: fileAnalysis.isGlb ? "model/gltf-binary" : "model/gltf+json",
                        });
                        const blobUrl = URL.createObjectURL(modelBlob);
                        setCachedModelBlob(blobUrl);
                      } catch (base64Error) {
                        // Fall through to network fallback
                      }
                    }
                  } else {
                    // Binary content - create blob directly
                    const modelBlob = new Blob([result.content], {
                      type: fileAnalysis.isGlb ? "model/gltf-binary" : "model/gltf+json",
                    });
                    const blobUrl = URL.createObjectURL(modelBlob);
                    setCachedModelBlob(blobUrl);
                  }
                } else if (result.url) {
                  // Only URL provided - use it directly
                  setOptimizedModelUrl(result.url);
                }

                setLoadingState((prev) => ({
                  ...prev,
                  status: "loading",
                  progress: 50, // Cached content gives us significant head start
                }));
              } catch (blobError) {
                // Clear any partial state and fallback to direct URL loading
                setCachedModelBlob(null);
                setOptimizedModelUrl(null);
              }
            }
          } catch (cacheError) {}
        }

        await ensureModelViewerLoaded();
        setIsModelViewerReady(true);
        setLoadingState((prev) => ({ ...prev, status: "idle" }));
      } catch (error) {
        handleError(error as Error, "Initialization");
        setIsModelViewerReady(false);
      }
    };

    initializeModelViewer();
  }, [handleError, asset.id, asset.size, asset.originalName, asset.mimeType]);

  // Setup model viewer events when ready
  useEffect(() => {
    if (isModelViewerReady && modelViewerRef.current) {
      return setupModelViewerEvents();
    }
    return undefined;
  }, [isModelViewerReady]); // Remove setupModelViewerEvents dependency - it's stable within the effect

  // Intersection observer for proper lazy loading - Fixed to work with shouldLoadModel
  useEffect(() => {
    if (finalConfig.loading === "lazy" && containerRef.current) {
      const container = containerRef.current;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setIsVisible(true); // Set visibility when element enters viewport
              if (!shouldLoadModel) {
                setShouldLoadModel(true);
                setLoadingState((prev) => ({
                  ...prev,
                  status: "loading",
                  startTime: Date.now(),
                }));
              }
            } else {
              // Hide model when element leaves viewport for memory efficiency
              setIsVisible(false);
            }
          }
        },
        {
          threshold: 0.1,
          rootMargin: "50px", // Start loading slightly before element comes into view
        },
      );

      observerRef.current.observe(container);

      // FIX: Check if element is already in viewport when observer is first attached
      // IntersectionObserver callbacks only fire on state changes, not initial state
      const rect = container.getBoundingClientRect();
      const isInViewport = rect.top < globalThis.innerHeight && rect.bottom > 0;

      if (isInViewport) {
        setIsVisible(true);
        if (!shouldLoadModel) {
          setShouldLoadModel(true);
          setLoadingState((prev) => ({
            ...prev,
            status: "loading",
            startTime: Date.now(),
          }));
        }
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
    return undefined;
  }, [
    finalConfig.loading,
    shouldLoadModel,
    isModelViewerReady,
    isVisible,
    cachedModelBlob,
    optimizedModelUrl,
    asset,
  ]);

  // Programmatically set src to prevent Lit element update conflicts
  // Gate src assignment behind userActivated to prevent premature loading
  useEffect(() => {
    if (isModelViewerReady && modelViewerRef.current && shouldLoadModel && isVisible) {
      // Use cached blob URL first, fallback to network
      let modelUrl: string;

      // Centralized src precedence with verification logging
      if (cachedModelBlob) {
        // Priority 1: Use cached blob URL - significant performance improvement
        modelUrl = cachedModelBlob;
      } else if (optimizedModelUrl) {
        // Priority 2: Use optimized model URL
        modelUrl = optimizedModelUrl;
      } else {
        // Priority 3: Fallback to network URL
        modelUrl =
          MediaUrlBuilder.buildModelUrlSafe(asset.id, asset) || `/api/media/${asset.id}/content`;
      }

      // Set src programmatically to avoid React/Lit element conflicts
      if (modelViewerRef.current.src !== modelUrl) {
        modelViewerRef.current.src = modelUrl;
      }

      setLoadingState((prev) => ({
        ...prev,
        status: "loading",
        startTime: Date.now(),
      }));
    } else if (
      isModelViewerReady &&
      modelViewerRef.current &&
      (!shouldLoadModel || !userActivated)
    ) {
      // Clear src when model should not be loaded OR user hasn't activated yet
      modelViewerRef.current.src = "";
    }
  }, [
    isModelViewerReady,
    shouldLoadModel,
    isVisible,
    userActivated,
    asset.id,
    cachedModelBlob,
    optimizedModelUrl,
  ]);

  // MEMORY LEAK FIX: Enhanced cleanup on unmount with aggressive memory management
  useEffect(() => {
    return () => {
      // Clear all retry timeouts - access current state directly
      setRetryTimeouts((current) => {
        for (const timeout of current) {
          clearTimeout(timeout);
        }
        return [];
      });

      // Stop memory monitoring - access current state directly
      setMemoryMonitorActive(false);

      // Force WebGL context cleanup
      if (webglContextRef.current) {
        try {
          const gl = webglContextRef.current;
          const extension = gl.getExtension("WEBGL_lose_context");
          if (extension) {
            extension.loseContext();
          }
        } catch (error) {}
      }

      // Clear all refs
      webglContextRef.current = null;

      // Disconnect intersection observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Clean up cached GLTF blob URLs on unmount - access via state setters
      setCachedModelBlob((current) => {
        if (current && current.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setOptimizedModelUrl((current) => {
        if (current && current.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
    };
  }, []); // Cleanup effect should have no dependencies

  // Handle user activation for click-to-load
  const handleActivateModel = useCallback(() => {
    setUserActivated(true);
    setShouldLoadModel(true);
    setIsVisible(true);

    // Dismiss poster to start loading the 3D model
    if (modelViewerRef.current && typeof modelViewerRef.current.dismissPoster === "function") {
      modelViewerRef.current.dismissPoster();
    }

    onInteraction?.("3d-activated", { asset });
  }, [asset, onInteraction]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!asset.id) return;

    try {
      onInteraction?.("download-start", { asset });

      const response = await fetch(`/api/media/${asset.id}/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const downloadName = asset.originalName || `model-${asset.id}`;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      onInteraction?.("download-complete", { asset });
    } catch (error) {
      handleError(error as Error, "Download");
    }
  }, [asset, handleError, onInteraction]);

  // Build model URL with proper MediaUrlBuilder logic for GLTF compatibility
  // Available for future use if dynamic URL building is needed
  // const buildModelUrl = useCallback(() => {
  //   // Use MediaUrlBuilder to choose correct endpoint (content vs proxy) based on file type
  //   return MediaUrlBuilder.buildModelUrlSafe(asset.id, asset) || `/api/media/proxy/${asset.id}`;
  // }, [asset]);

  const fileInfo = analyzeFile();

  // Render loading state
  if (!isModelViewerReady || loadingState.status === "initializing") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200",
          "dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-square",
          className,
        )}
      >
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Initializing 3D viewer...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadingState.status === "error") {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100",
          "dark:from-red-900/20 dark:to-red-800/20 rounded-lg aspect-square",
          className,
        )}
      >
        <div className="text-center space-y-4 p-6">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <Alert variant="destructive">
            <AlertDescription>
              {loadingState.errorMessage || "Failed to load 3D model"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry ({loadingState.retryCount}/3)
          </Button>
        </div>
      </div>
    );
  }

  // Wrap main content in error boundary for React error handling (hook moved earlier)
  return (
    <ModelViewerErrorBoundary
      key={`${errorBoundaryKey}-${asset.id}`} // Force remount on asset change or recovery
      asset={asset}
      onError={handleErrorBoundaryError}
      onRecovery={handleErrorBoundaryRecovery}
      showDevDetails={MODEL_VIEWER_ENVIRONMENT.isDevelopment}
      resetKeys={[String(asset.id), asset.filename || "", loadingState.status]} // Auto-reset triggers
    >
      <div
        ref={containerRef}
        className={cn(
          "relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden",
          "dark:from-gray-800 dark:to-gray-900",
          className,
        )}
        data-testid="unified-model-viewer"
      >
        {/* Simplified file info - only for large files */}
        {showFileInfo && fileInfo.isLarge && (
          <div className="absolute top-2 left-2 z-20">
            <div className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fileInfo.sizeInMB}MB
            </div>
          </div>
        )}

        {/* Simplified loading indicator - hide when loaded or at 100% */}
        {showLoadingProgress &&
          loadingState.status === "loading" &&
          loadingState.progress < 100 && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-50/80 dark:bg-gray-900/80">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{loadingState.progress}%</p>
              </div>
            </div>
          )}

        {/* Simplified controls - only download for grid cards */}
        {showControls && loadingState.status === "loaded" && (
          <div className="absolute top-2 right-2 z-30">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black w-8 h-8 p-0"
              data-testid="button-download"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* WebGL lost warning */}
        {webglLost && (
          <div className="absolute inset-4 z-40 flex items-center justify-center">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Graphics context lost.
                <Button variant="link" size="sm" onClick={handleWebGLRecovery} className="ml-2 p-0">
                  Recover
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Model Viewer - Stable attributes to prevent Lit element update conflicts */}
        {/* Model Viewer - Stable attributes to prevent Lit element update conflicts */}
        {isVisible &&
          React.createElement("model-viewer", {
            ref: modelViewerRef as any,
            // src set programmatically in useEffect
            alt: asset.originalName || "3D Model",
            poster: asset.thumbnailUrl || undefined, // Use thumbnail as poster image
            reveal: userActivated || finalConfig.loading === "auto" ? "auto" : "interaction", // Use "auto" for modal, "interaction" for grid
            "camera-controls": finalConfig.cameraControls,
            "auto-rotate": isMobile ? false : finalConfig.autoRotate, // Disable auto-rotate on mobile to save battery
            "background-color": finalConfig.backgroundColorHex,
            exposure: isMobile ? Math.min(finalConfig.exposure || 1, 0.8) : finalConfig.exposure, // Reduce exposure on mobile
            "shadow-intensity": isMobile ? 0.5 : finalConfig.shadowIntensity, // Reduce shadow-sm intensity on mobile (50% less GPU work)
            "interaction-policy": finalConfig.interactionPolicy,
            "draco-decoder-path": "https://www.gstatic.com/draco/versioned/decoders/1.5.6/", // Enable Draco compression
            className: "w-full h-full min-h-[400px]",
            style: {
              width: "100%",
              height: "100%",
              minHeight: "400px",
              backgroundColor: finalConfig.backgroundColorHex || "#000000",
            },
            "data-testid": "model-viewer-element",
          })}

        {/* Enhanced placeholder - poster image + "View 3D Model" button */}
        {!userActivated && isVisible && shouldLoadModel && (
          <div
            className="absolute inset-0 flex items-center justify-center group cursor-pointer"
            onClick={handleActivateModel}
            data-testid="view-3d-overlay"
          >
            {/* Poster image background */}
            {asset.thumbnailUrl && (
              <img
                src={asset.thumbnailUrl}
                alt={asset.originalName || "3D Model Preview"}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {/* Gradient overlay for better button visibility */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 group-hover:from-black/50 group-hover:via-black/40 group-hover:to-black/60 transition-all duration-300" />

            {/* "View 3D Model" button */}
            <div className="relative z-10 text-center space-y-3">
              <div className="dark:bg-black/90 backdrop-blur-xs rounded-full p-4 group-hover:scale-110 transition-transform duration-300 shadow-xl pt-[33px] pb-[33px] pl-[16px] pr-[16px] ml-[87px] mr-[87px] mt-[53px] mb-[53px] bg-[#ffffffd1]">
                <Play className="w-8 h-8 text-gray-900 dark:text-white" fill="currentColor" />
              </div>
              <p className="text-white font-medium text-lg drop-shadow-lg">View 3D Model</p>
              <p className="text-white/80 text-xs">Click to load interactive 3D viewer</p>
            </div>
          </div>
        )}

        {/* Lazy loading placeholder - shown before viewport intersection */}
        {(!shouldLoadModel || !isVisible) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center space-y-2">
              <Box className="w-8 h-8 mx-auto text-gray-400" />
              {!shouldLoadModel ? (
                <p className="text-xs text-gray-500">Scroll to load</p>
              ) : (
                <p className="text-xs text-gray-500">Model hidden</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ModelViewerErrorBoundary>
  );
}
