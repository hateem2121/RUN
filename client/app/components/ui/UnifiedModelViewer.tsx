import type { MediaAsset } from "@shared/schema";
import { AlertCircle, Box, Download, Loader2, Play, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ModelViewerErrorBoundary } from "@/components/ui/ModelViewerErrorBoundary";
import { useIsMobile } from "@/hooks/use-is-mobile";
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
import type { ModelViewerElement, ModelViewerErrorEvent } from "@/types/model-viewer";

// Enhanced loading state for comprehensive tracking
interface LoadingState {
  status: "idle" | "initializing" | "loading" | "loaded" | "error";
  progress: number;
  bytesLoaded?: number | undefined;
  totalBytes?: number | undefined;
  errorMessage?: string | undefined;
  retryCount: number;
  startTime: number;
}

export interface UnifiedModelViewerProps {
  asset: MediaAsset;
  className?: string | undefined;
  config?: ModelViewerConfig;
  showControls?: boolean | undefined;
  showLoadingProgress?: boolean | undefined;
  showFileInfo?: boolean | undefined;
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
  const isMobile = useIsMobile();

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
  const [isVisible, setIsVisible] = useState(finalConfig.loading !== "lazy");

  const [userActivated, setUserActivated] = useState(
    finalConfig.loading === "auto" && finalConfig.cameraControls,
  );

  // State for cached GLTF content management
  const [cachedModelBlob, setCachedModelBlob] = useState<string | null>(null);
  const [optimizedModelUrl, setOptimizedModelUrl] = useState<string | null>(null);

  // Refs
  const modelViewerRef = useRef<ModelViewerElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
        } catch (_error) {}
      }
    },
    [retryTimeouts],
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
    (event: ModelViewerErrorEvent | Error, _context?: string) => {
      let errorMessage: string;

      if (event instanceof Error) {
        errorMessage = event.message;
      } else {
        const errorDetail = event.detail;
        errorMessage = errorDetail?.message || errorDetail?.type || "Model loading failed";
      }

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
  const handleProgress = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ totalProgress?: number }>;
    const progress = customEvent.detail?.totalProgress || 0;
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
  }, [
    loadingState.retryCount,
    errorConfig.maxRetries,
    errorConfig.retryDelayBase,
    finalConfig.autoRotate,
    finalConfig.cameraControls,
    retryTimeouts,
  ]); // Remove unstable dependencies

  // Simple WebGL context recovery
  const handleWebGLRecovery = useCallback(() => {
    if (modelViewerRef.current) {
      try {
        const currentSrc = modelViewerRef.current.src;
        modelViewerRef.current.src = "";

        setTimeout(() => {
          if (modelViewerRef.current) {
            modelViewerRef.current.src = currentSrc;
            setWebglLost(false);
          }
        }, 200);
      } catch (error) {
        handleError(error as Error, "WebGL Recovery");
      }
    }
  }, [handleError]);

  // REMOVED: Data URI compatibility layer that was interfering with @google/model-viewer
  // @google/model-viewer handles embedded textures natively with proper CSP headers

  // Model viewer event handlers
  // Model viewer event handlers
  const setupModelViewerEvents = useCallback(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) {
      return;
    }

    // Model loaded successfully
    const handleModelLoaded = () => {
      // Update loading state immediately
      setLoadingState((prev) => ({
        ...prev,
        status: "loaded",
        progress: 100,
      }));

      onLoad?.(asset);
      onInteraction?.("model-loaded", { asset });
    };

    // Loading error
    const handleModelError = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string; message?: string } | string>;
      const errorDetail = customEvent.detail;
      const errorMessage =
        typeof errorDetail === "string"
          ? errorDetail
          : typeof errorDetail === "object" && errorDetail
            ? errorDetail.message || errorDetail.type || JSON.stringify(errorDetail)
            : "Model loading failed";
      handleError(new Error(errorMessage), "Model Loading");
    };

    // WebGL context events
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglLost(true);
      setLoadingState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "Graphics context lost. Attempting to recover...",
      }));
    };

    const handleContextRestored = () => {
      setWebglLost(false);
      // Predictive Recovery: Automatically trigger recovery when context is back
      handleWebGLRecovery();
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
      }, 500);
    }

    // Cleanup function
    return () => {
      if (retryCanvas) {
        clearTimeout(retryCanvas);
      }

      modelViewer.removeEventListener("progress", handleProgress);
      modelViewer.removeEventListener("load", handleModelLoaded);
      modelViewer.removeEventListener("error", handleModelError);

      // Clean up WebGL listeners from Shadow DOM
      const currentCanvas = getCanvas();
      if (currentCanvas) {
        currentCanvas.removeEventListener("webglcontextlost", handleContextLost);
        currentCanvas.removeEventListener("webglcontextrestored", handleContextRestored);
      }
    };
  }, [
    asset.id,
    asset,
    handleError,
    handleProgress,
    onInteraction,
    onLoad, // Predictive Recovery: Automatically trigger recovery when context is back
    handleWebGLRecovery,
  ]);

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
                if (cachedModelBlob?.startsWith("blob:")) {
                  URL.revokeObjectURL(cachedModelBlob);
                }
                if (optimizedModelUrl?.startsWith("blob:")) {
                  URL.revokeObjectURL(optimizedModelUrl);
                }

                if (result.content) {
                  // Check content type - log first 20 chars for debugging
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
                      } catch (_base64Error) {
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
              } catch (_blobError) {
                // Clear any partial state and fallback to direct URL loading
                setCachedModelBlob(null);
                setOptimizedModelUrl(null);
              }
            }
          } catch (_cacheError) {}
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
  }, [handleError, asset.id, analyzeFile, cachedModelBlob, optimizedModelUrl]);

  // Setup model viewer events when ready
  useEffect(() => {
    if (isModelViewerReady && modelViewerRef.current) {
      return setupModelViewerEvents();
    }
    return undefined;
  }, [isModelViewerReady, setupModelViewerEvents]); // Remove setupModelViewerEvents dependency - it's stable within the effect

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
  }, [finalConfig.loading, shouldLoadModel]);

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
    asset,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all retry timeouts
      setRetryTimeouts((current) => {
        for (const timeout of current) {
          clearTimeout(timeout);
        }
        return [];
      });

      // Disconnect intersection observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Clean up cached GLTF blob URLs on unmount
      setCachedModelBlob((current) => {
        if (current?.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setOptimizedModelUrl((current) => {
        if (current?.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
    };
  }, []);

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
    if (!asset.id) {
      return;
    }

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
          "center-flex from-surface-subtle to-surface-muted bg-linear-to-br",
          "dark:from-muted dark:to-background aspect-square rounded-lg",
          className,
        )}
      >
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-text-disabled dark:text-muted-foreground text-sm">
            Initializing 3D viewer...
          </p>
        </div>
      </div>
    );
  }

  // Render error/fallback state (Polished UI instead of raw error)
  if (loadingState.status === "error") {
    return (
      <div
        className={cn(
          "group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg",
          "bg-surface-subtle dark:bg-muted",
          className,
        )}
      >
        {/* Placeholder Image */}
        <img
          src={asset.thumbnailUrl || "/placeholder-jacket.svg"}
          alt="Product Preview"
          className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
        />

        {/* Overlay Content */}
        <div className="z-elevated text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
            <Box className="text-foreground/80 h-8 w-8 dark:text-white" />
          </div>
          <p className="text-foreground font-medium dark:text-white">Product Preview</p>
          <p className="text-muted-foreground text-xs">3D Model Unavailable</p>

          {/* Debug info in development only */}
          {MODEL_VIEWER_ENVIRONMENT.isDevelopment && (
            <p className="max-w-widget-track text-xxs mt-2 truncate px-2 text-red-400">
              {loadingState.errorMessage}
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="mt-3 text-xs hover:bg-white/20"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry Load
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
          "from-background to-surface-subtle relative overflow-hidden rounded-lg bg-linear-to-br",
          "dark:from-muted dark:to-background",
          className,
        )}
        data-testid="unified-model-viewer"
      >
        {/* Simplified file info - only for large files */}
        {showFileInfo && fileInfo.isLarge && (
          <div className="z-elevated absolute top-2 left-2">
            <div className="flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
              <AlertCircle className="h-3 w-3" />
              {fileInfo.sizeInMB}MB
            </div>
          </div>
        )}

        {/* Simplified loading indicator - hide when loaded or at 100% */}
        {showLoadingProgress &&
          loadingState.status === "loading" &&
          loadingState.progress < 100 && (
            <div className="center-flex z-elevated bg-background/80 dark:bg-background/80 absolute inset-0">
              <div className="space-y-2 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <p className="text-text-disabled dark:text-muted-foreground text-sm">
                  {loadingState.progress}%
                </p>
              </div>
            </div>
          )}

        {/* Simplified controls - only download for grid cards */}
        {showControls && loadingState.status === "loaded" && (
          <div className="z-dropdown absolute top-2 right-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 bg-white/80 p-0 hover:bg-white dark:bg-black/80 dark:hover:bg-black"
              data-testid="button-download"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* WebGL lost warning */}
        {webglLost && (
          <div className="center-flex z-sticky absolute inset-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
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
            className: "w-full h-full min-h-96",
            style: {
              width: "100%",
              height: "100%",
              minHeight: "400px",
              backgroundColor: finalConfig.backgroundColorHex || "hsl(240 10% 4%)", // matches --background
            },
            "data-testid": "model-viewer-element",
          })}

        {/* Enhanced placeholder - poster image + "View 3D Model" button */}
        {!userActivated && isVisible && shouldLoadModel && (
          <div
            className="group absolute inset-0 flex cursor-pointer items-center justify-center"
            onClick={handleActivateModel}
            data-testid="view-3d-overlay"
          >
            {/* Poster image background */}
            {asset.thumbnailUrl && (
              <img
                src={asset.thumbnailUrl}
                alt={asset.originalName || "3D Model Preview"}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            )}

            {/* Gradient overlay for better button visibility */}
            <div className="absolute inset-0 bg-linear-to-br from-black/40 via-black/30 to-black/50 transition-all duration-300 group-hover:from-black/50 group-hover:via-black/40 group-hover:to-black/60" />

            {/* "View 3D Model" button */}
            <div className="z-elevated relative space-y-3 text-center">
              <div className="mx-20 my-12 rounded-full bg-white/80 p-4 px-4 py-8 shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 dark:bg-black/90">
                <Play className="text-foreground h-8 w-8 dark:text-white" fill="currentColor" />
              </div>
              <p className="text-lg font-medium text-white drop-shadow-lg">View 3D Model</p>
              <p className="text-xs text-white/80">Click to load interactive 3D viewer</p>
            </div>
          </div>
        )}

        {/* Lazy loading placeholder - shown before viewport intersection */}
        {(!shouldLoadModel || !isVisible) && (
          <div className="center-flex from-surface-subtle to-surface-muted dark:from-muted dark:to-background absolute inset-0 bg-linear-to-br">
            <div className="space-y-2 text-center">
              <Box className="text-text-subtle mx-auto h-8 w-8" />
              {!shouldLoadModel ? (
                <p className="text-text-muted text-xs">Scroll to load</p>
              ) : (
                <p className="text-text-muted text-xs">Model hidden</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ModelViewerErrorBoundary>
  );
}
