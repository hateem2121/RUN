import React, { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useToast } from "@/hooks/use-toast";
import { getQueryClient } from "@/lib/queryClient";
import { MediaLibraryProvider, useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";

const MediaGrid = React.lazy(() => import("./MediaGrid"));
const MediaFiltersPanel = React.lazy(() => import("./MediaFiltersPanel"));
const MediaUploadEnhanced = React.lazy(() => import("./MediaUploadEnhanced"));
const MediaViewerModal = React.lazy(() => import("./MediaViewerModal"));

import type { MediaAsset } from "@shared/schema";
import { AlertTriangle, PanelLeft, RefreshCw, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { invalidateMediaQueries } from "@/lib/media-query-keys";
import { cn } from "@/lib/utils";

// Define types for the cleanup response
interface CleanupResult {
  totalCleaned?: number;
  details?: Record<string, unknown>;
  message?: string;
  error?: string;
}

// Phase 2: Enhanced Container with Error Boundaries & Performance Monitoring
import type { FallbackProps } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
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
          <div className="text-red-700 text-sm">
            <p className="mb-2 font-medium">Something went wrong:</p>
            <p className="rounded-md bg-red-100 p-3 font-mono text-xs">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-red-600 text-sm">Recovery Options:</p>
            <ul className="space-y-1 text-red-600 text-sm">
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
              <RefreshCw className="mr-2 h-4 w-4" />
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
    <div className="center-flex p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2"></div>
        <p className="text-muted-foreground text-sm">Loading media library...</p>
      </div>
    </div>
  );
}

interface MediaLibraryContainerEnhancedProps {
  selectionMode?: boolean | undefined;
  useExistingContext?: boolean | undefined;
  initialFilter?: string | undefined; // Auto-set initial filter type
  mediaPickerTarget?: string | undefined; // For context-aware filtering
  onAssetSelect?: (assetId: number, asset?: MediaAsset) => void; // Direct asset selection callback
}

export default function MediaLibraryContainerEnhanced({
  selectionMode = false,
  // useExistingContext = false,
  initialFilter = "all",
  // mediaPickerTarget removed
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
      let result: CleanupResult;
      try {
        result = (await response.json()) as CleanupResult;
      } catch (_jsonError) {
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
              ? `Successfully cleaned ${cleanedCount} corrupt entries across ${
                  Object.keys(details).length
                } tables.`
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

    const handleError = (_event: ErrorEvent) => {
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
        "flex h-full flex-col bg-background",
        // STANDALONE MODE: Enable overflow-hidden to contain scrolling within component
        isStandalone && "overflow-hidden",
      )}
    >
      {/* Enhanced responsive header */}
      <div className="shrink-0 border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg md:text-2xl">Media Library</h1>
            </div>
          </div>
          {!selectionMode && (
            <div className="flex items-center gap-2">
              {/* Development controls */}
              {(import.meta as unknown as { env: { MODE: string } }).env?.MODE ===
                "development" && (
                <>
                  <div className="hidden items-center gap-2 rounded-lg bg-muted/50 px-3 py-1 md:flex">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      Pagination Mode
                    </Badge>
                  </div>

                  <Separator orientation="vertical" className="hidden h-6 md:block" />

                  <Button
                    onClick={handleDatabaseCleanup}
                    disabled={isCleaningUp}
                    variant="outline"
                    size="sm"
                    className="hidden gap-2 md:flex"
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
        {...(onAssetSelect ? { onAssetSelect } : {})}
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
    }, [initialFilter, state.selectedType, updateState]);

    return null;
  };

  return (
    <MediaLibraryProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AutoFilterInitializer />
        {content}
      </ErrorBoundary>
    </MediaLibraryProvider>
  );
}

// Separate component to access the context properly
function MediaLibraryMainContent({
  selectionMode = false,
  onAssetSelect,
  // paginationMode removed
  isStandalone,
}: Readonly<{
  selectionMode?: boolean | undefined;
  onAssetSelect?: (assetId: number, asset?: MediaAsset) => void;
  paginationMode?: "traditional";
  isStandalone: boolean;
}>) {
  const { state, updateState } = useMediaLibraryEnhanced();

  // Phase 3: Development-mode validation warnings
  useEffect(() => {
    if ((import.meta as unknown as { env: { MODE: string } }).env?.MODE === "development") {
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Responsive Filters sidebar */}
      {state.showFiltersPanel && (
        <>
          {/* Desktop sidebar */}
          <div className="hidden w-80 border-r bg-card transition-all duration-300 ease-in-out lg:block">
            <ErrorBoundary
              FallbackComponent={({ resetErrorBoundary }) => (
                <div className="p-4 text-center">
                  <p className="mb-2 text-red-600 text-sm">Filter panel error</p>
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
            className="fixed inset-0 z-modal-nested cursor-default bg-black/50 lg:hidden"
            onClick={() => updateState("showFiltersPanel", false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                updateState("showFiltersPanel", false);
              }
            }}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="filters-panel-title"
              tabIndex={-1}
              className="fixed inset-y-0 left-0 w-80 max-w-md bg-card shadow-xl sm:max-w-lg"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <ErrorBoundary
                FallbackComponent={({ resetErrorBoundary }) => (
                  <div className="p-4 text-center">
                    <p className="mb-2 text-red-600 text-sm">Filter panel error</p>
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
      <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col")}>
        {/* Show filters toggle when panel is hidden */}
        {!state.showFiltersPanel && (
          <div className="shrink-0 border-b bg-card p-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateState("showFiltersPanel", true)}
              title="Show filters panel"
            >
              <PanelLeft className="mr-2 h-4 w-4" />
              Show Filters
            </Button>
          </div>
        )}

        {/* SURGICAL FIX: Content area with conditional scroll ownership */}
        <div className={cn("flex min-h-0 flex-1 flex-col")}>
          {/* Enhanced upload section - hidden in selection mode */}
          {!selectionMode && (
            <div className="shrink-0 border-b bg-card">
              <ErrorBoundary
                FallbackComponent={({ resetErrorBoundary }) => (
                  <div className="p-4 text-center">
                    <p className="mb-2 text-red-600 text-sm">Upload handler error</p>
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
              "min-h-0 flex-1",
              // STANDALONE MODE: This container becomes the scroll owner
              // DIALOG MODE: No overflow to let DialogBody handle scrolling
              isStandalone && "overflow-y-auto",
            )}
          >
            <ErrorBoundary
              FallbackComponent={({ resetErrorBoundary }) => (
                <div className="p-8 text-center">
                  <p className="mb-4 text-red-600 text-sm">Media grid error</p>
                  <Button onClick={resetErrorBoundary}>Reset Grid</Button>
                </div>
              )}
            >
              <Suspense fallback={<LoadingFallback />}>
                <MediaGrid
                  selectionMode={selectionMode}
                  isStandalone={isStandalone}
                  {...(onAssetSelect ? { onAssetSelect } : {})}
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
            <p className="mb-2 text-sm">Media viewer error</p>
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
