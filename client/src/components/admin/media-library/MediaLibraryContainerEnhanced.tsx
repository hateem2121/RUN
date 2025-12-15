import React, { useEffect, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useToast } from "@/hooks/use-toast";
import { getQueryClient } from "@/lib/queryClient";
import { useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";
const MediaGrid = React.lazy(() => import("./MediaGrid"));
const MediaFiltersPanel = React.lazy(() => import("./MediaFiltersPanel"));
const MediaUploadEnhanced = React.lazy(() => import("./MediaUploadEnhanced"));
const MediaViewerModal = React.lazy(() => import("./MediaViewerModal"));
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, RefreshCw, PanelLeft, Trash2, Settings } from "lucide-react";
import { invalidateMediaQueries } from "@/lib/media-query-keys";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@shared/schema";

// Phase 2: Enhanced Container with Error Boundaries & Performance Monitoring
function ErrorFallback({
  error,
  resetErrorBoundary,
}: Readonly<{ error: Error; resetErrorBoundary: () => void }>) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Media Library Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-red-700">
            <p className="font-medium mb-2">Something went wrong:</p>
            <p className="bg-red-100 p-3 rounded-md font-mono text-xs">{error.message}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium">Recovery Options:</p>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• Try refreshing the page</li>
              <li>• Clear browser cache</li>
              <li>• Check internet connection</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={resetErrorBoundary}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={() => {
                // Refresh without losing state
                globalThis.dispatchEvent(new CustomEvent("media-refresh"));
                // Only invalidate cache on manual user refresh, not automatic
                invalidateMediaQueries(getQueryClient());
              }}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading media library...</p>
      </div>
    </div>
  );
}

interface MediaLibraryContainerEnhancedProps {
  selectionMode?: boolean;
  useExistingContext?: boolean;
  initialFilter?: string; // Auto-set initial filter type
  mediaPickerTarget?: string; // For context-aware filtering
  onAssetSelect?: (assetId: number, asset?: MediaAsset) => void; // Direct asset selection callback
}

export default function MediaLibraryContainerEnhanced({
  selectionMode = false,
  // useExistingContext = false,
  initialFilter = "all",
  mediaPickerTarget = "",
  onAssetSelect,
}: MediaLibraryContainerEnhancedProps = {}) {
  const { toast } = useToast();

  // SIMPLIFIED: Pure traditional pagination mode (infinite scroll eliminated)
  const paginationMode = "traditional"; // Always traditional pagination for clean architecture

  // Phase 3: Database Cleanup State
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Phase 3: Enhanced database cleanup function with comprehensive error handling
  const handleDatabaseCleanup = async () => {
    setIsCleaningUp(true);

    try {
      // Enhanced timeout and error handling for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // FORENSIC FIX: Use the correct endpoint that actually exists
      const response = await fetch("/api/admin/media-sync/repair?cleanup=true", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("[MediaLibraryContainer] Failed to parse cleanup response:", jsonError);
        throw new Error(`Invalid response format: ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        // Success case with enhanced feedback
        const cleanedCount = result.totalCleaned || 0;
        const details = result.details || {};

        toast({
          title: "Database Cleanup Complete",
          description:
            cleanedCount > 0
              ? `Successfully cleaned ${cleanedCount} corrupt entries across ${Object.keys(details).length} tables.`
              : "Database scan completed - no corrupt entries found.",
        });

        // Refresh media library after cleanup
        invalidateMediaQueries(getQueryClient());
      } else {
        // Handle different types of server errors - fix boolean conversion
        const errorMessage = String(
          result?.message || result?.error || `Server error: ${response.status}`,
        );
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Comprehensive error handling with specific error types
      let errorMessage = "Unable to clean database";
      let errorTitle = "Cleanup Failed";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorTitle = "Cleanup Timeout";
          errorMessage = "Database cleanup took too long and was cancelled. Try again later.";
        } else if (error.message.includes("Failed to fetch")) {
          errorTitle = "Connection Error";
          errorMessage = "Unable to connect to the server. Check your internet connection.";
        } else if (error.message.includes("Invalid response")) {
          errorTitle = "Server Error";
          errorMessage = "Server returned an invalid response. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      if (process.env.NODE_ENV === "development")
        console.error("Database cleanup error:", {
          error,
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Enhanced global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Enhanced logging with categorization
      const error = event.reason;
      const errorType = error instanceof Error ? error.constructor.name : typeof error;
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      // PERFORMANCE FIX: Detect and gracefully handle AbortError rejections from cancelled requests
      const isAbortError =
        errorType === "AbortError" ||
        (errorType === "DOMException" && message.includes("aborted")) ||
        message.includes("signal is aborted") ||
        message.includes("cancelled") ||
        message.includes("abort");

      if (isAbortError) {
        // Handle AbortError gracefully - these are normal cancellations from dialog close, navigation, etc.
        if (import.meta.env?.DEV) {
          console.debug("[MediaLibrary] Request cancelled (normal behavior):", {
            type: errorType,
            message,
            timestamp: new Date().toISOString(),
            note: "This is a normal request cancellation, not an error",
          });
        }

        // Prevent the default behavior - no user notification needed for cancellations
        event.preventDefault();
        return; // Exit early - do NOT log as CRITICAL
      }

      // CRITICAL FIX: Precisely detect ImageBitmapLoader/Model Viewer errors (not generic fetch failures)
      const isModelViewerTextureError =
        message.includes("ImageBitmapLoader") ||
        stack?.includes("ImageBitmapLoader") ||
        stack?.includes("@google/model-viewer") ||
        stack?.includes("model-viewer") ||
        (stack?.includes("three.js") && message.includes("texture"));

      if (isModelViewerTextureError) {
        // Handle Model Viewer texture errors gracefully - these are rendering issues, not system failures
        if (import.meta.env?.DEV) {
          console.warn("Model Viewer texture loading error handled gracefully:", {
            type: errorType,
            message,
            timestamp: new Date().toISOString(),
            note: "This is a 3D model texture loading issue, not a system failure",
          });
        }

        // Prevent the default behavior
        event.preventDefault();

        // Show gentle notification for texture loading issues
        toast({
          title: "3D Model Texture Loading",
          description:
            "Some model textures may not display perfectly. The model is still functional.",
          variant: "default", // Use default variant, not destructive
        });

        return; // Exit early - do NOT auto-reload for texture issues
      }

      // For non-texture related errors, log as critical
      console.error("CRITICAL: Unhandled promise rejection in MediaLibraryEnhanced:", {
        type: errorType,
        reason: error,
        message,
        stack,
        timestamp: new Date().toISOString(),
      });

      // Prevent the default behavior (which would crash the app)
      event.preventDefault();

      // Show user-friendly error notification for critical errors
      if (
        error instanceof Error &&
        (error.message.includes("cleanup") ||
          error.message.includes("media") ||
          error.message.includes("database"))
      ) {
        toast({
          title: "Background Operation Error",
          description:
            "A background process encountered an issue. Please refresh the page if problems persist.",
          variant: "destructive",
        });
      }

      // Show user-friendly error message for genuine system errors
      toast({
        title: "System Error",
        description: "A critical error occurred. The system will attempt to recover.",
        variant: "destructive",
      });

      // Only auto-reload for genuine system errors, NOT for texture loading issues
      setTimeout(() => {
        // Auto-recovery: Page reload instead of cache invalidation to prevent cache churn
        globalThis.location.reload();
      }, 5000);
    };

    const handleError = (event: ErrorEvent) => {
      console.error("CRITICAL: Global error in MediaLibraryEnhanced:", event.error);

      toast({
        title: "Application Error",
        description: "An unexpected error occurred. Please refresh the page.",
        variant: "destructive",
      });
    };

    // Add global error handlers
    globalThis.addEventListener("unhandledrejection", handleUnhandledRejection);
    globalThis.addEventListener("error", handleError);

    return () => {
      globalThis.removeEventListener("unhandledrejection", handleUnhandledRejection);
      globalThis.removeEventListener("error", handleError);
    };
  }, [toast]);

  // SURGICAL FIX: Conditional scroll logic - standalone needs internal scroll, dialogs use external
  const isStandalone = !selectionMode;

  const content = (
    <div
      className={cn(
        "flex flex-col h-full bg-background",
        // STANDALONE MODE: Enable overflow-hidden to contain scrolling within component
        isStandalone && "overflow-hidden",
      )}
    >
      {/* Enhanced responsive header */}
      <div className="shrink-0 border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-bold">Media Library</h1>
            </div>
          </div>
          {!selectionMode && (
            <div className="flex items-center gap-2">
              {/* Development controls */}
              {(import.meta as any).env?.MODE === "development" && (
                <>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      Pagination Mode
                    </Badge>
                  </div>

                  <Separator orientation="vertical" className="h-6 hidden md:block" />

                  <Button
                    onClick={handleDatabaseCleanup}
                    disabled={isCleaningUp}
                    variant="outline"
                    size="sm"
                    className="hidden md:flex gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isCleaningUp ? "Cleaning..." : "Cleanup DB"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content area with enhanced error boundaries */}
      <MediaLibraryMainContent
        selectionMode={selectionMode}
        onAssetSelect={onAssetSelect}
        paginationMode={paginationMode}
        isStandalone={isStandalone}
      />
    </div>
  );

  // Auto-filter initialization component
  const AutoFilterInitializer = () => {
    const { state, updateState } = useMediaLibraryEnhanced();

    React.useEffect(() => {
      if (initialFilter !== "all" && state.selectedType !== initialFilter) {
        updateState("selectedType", initialFilter);
      }
    }, [initialFilter, mediaPickerTarget, state.selectedType, updateState]);

    return null;
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AutoFilterInitializer />
      {content}
    </ErrorBoundary>
  );
}

// Separate component to access the context properly
function MediaLibraryMainContent({
  selectionMode = false,
  onAssetSelect,
  paginationMode = "traditional",
  isStandalone,
}: Readonly<{
  selectionMode?: boolean;
  onAssetSelect?: (assetId: number, asset?: MediaAsset) => void;
  paginationMode?: "traditional";
  isStandalone: boolean;
}>) {
  const { state, updateState } = useMediaLibraryEnhanced();

  // Phase 3: Development-mode validation warnings
  useEffect(() => {
    if ((import.meta as any).env?.MODE === "development") {
      if (!paginationMode) {
        if (process.env.NODE_ENV === "development")
          console.warn(
            "⚠️ MediaLibraryMainContent: paginationMode prop is undefined - using fallback",
          );
      }
      if (typeof onAssetSelect !== "function" && onAssetSelect !== undefined) {
        if (process.env.NODE_ENV === "development")
          console.warn("⚠️ MediaLibraryMainContent: onAssetSelect should be function or undefined");
      }
    }
  }, [paginationMode, onAssetSelect]);

  return (
    <div className="flex-1 flex min-h-0">
      {/* Responsive Filters sidebar */}
      {state.showFiltersPanel && (
        <>
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-80 border-r bg-card transition-all duration-300 ease-in-out">
            <ErrorBoundary
              FallbackComponent={({ resetErrorBoundary }) => (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-600 mb-2">Filter panel error</p>
                  <Button size="sm" onClick={resetErrorBoundary}>
                    Reset
                  </Button>
                </div>
              )}
            >
              <Suspense fallback={<LoadingFallback />}>
                <MediaFiltersPanel />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Mobile/Tablet modal overlay with proper accessibility */}
          <div
            className="lg:hidden fixed inset-0 z-modal-nested bg-black/50 cursor-default"
            onClick={() => updateState("showFiltersPanel", false)}
            role="presentation"
            aria-label="Close filters panel"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="filters-panel-title"
              className="fixed inset-y-0 left-0 w-80 max-w-md sm:max-w-lg bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <ErrorBoundary
                FallbackComponent={({ resetErrorBoundary }) => (
                  <div className="p-4 text-center">
                    <p className="text-sm text-red-600 mb-2">Filter panel error</p>
                    <Button size="sm" onClick={resetErrorBoundary}>
                      Reset
                    </Button>
                  </div>
                )}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <MediaFiltersPanel />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </>
      )}

      {/* Content area - SURGICAL FIX: Conditional overflow for standalone vs dialog contexts */}
      <div className={cn("flex-1 flex flex-col min-w-0 min-h-0")}>
        {/* Show filters toggle when panel is hidden */}
        {!state.showFiltersPanel && (
          <div className="shrink-0 p-2 border-b bg-card">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateState("showFiltersPanel", true)}
              title="Show filters panel"
            >
              <PanelLeft className="h-4 w-4 mr-2" />
              Show Filters
            </Button>
          </div>
        )}

        {/* SURGICAL FIX: Content area with conditional scroll ownership */}
        <div className={cn("flex-1 flex flex-col min-h-0")}>
          {/* Enhanced upload section - hidden in selection mode */}
          {!selectionMode && (
            <div className="shrink-0 border-b bg-card">
              <ErrorBoundary
                FallbackComponent={({ resetErrorBoundary }) => (
                  <div className="p-4 text-center">
                    <p className="text-sm text-red-600 mb-2">Upload handler error</p>
                    <Button size="sm" onClick={resetErrorBoundary}>
                      Reset
                    </Button>
                  </div>
                )}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <MediaUploadEnhanced />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}

          {/* Enhanced grid/list view - ARCHITECTURAL FIX: Single scroll ownership */}
          <div
            className={cn(
              "flex-1 min-h-0",
              // STANDALONE MODE: This container becomes the scroll owner
              // DIALOG MODE: No overflow to let EnhancedDialogBody handle scrolling
              isStandalone && "overflow-y-auto",
            )}
          >
            <ErrorBoundary
              FallbackComponent={({ resetErrorBoundary }) => (
                <div className="p-8 text-center">
                  <p className="text-sm text-red-600 mb-4">Media grid error</p>
                  <Button onClick={resetErrorBoundary}>Reset Grid</Button>
                </div>
              )}
            >
              <Suspense fallback={<LoadingFallback />}>
                <MediaGrid
                  selectionMode={selectionMode}
                  isStandalone={isStandalone}
                  onAssetSelect={onAssetSelect}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* CRITICAL FIX: Add MediaViewerModal - was imported but never rendered */}
      <ErrorBoundary
        FallbackComponent={({ resetErrorBoundary }) => (
          <div className="p-4 text-center text-red-600">
            <p className="text-sm mb-2">Media viewer error</p>
            <Button size="sm" onClick={resetErrorBoundary}>
              Reset
            </Button>
          </div>
        )}
      >
        <Suspense fallback={<div />}>
          <MediaViewerModal />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
