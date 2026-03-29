import React, { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useToast } from "@/hooks/use-toast";
import { getQueryClient } from "@/lib/queryClient";
import { MediaLibraryProvider, useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";

const MediaGrid = React.lazy(() => import("./MediaGrid").then((m) => ({ default: m.MediaGrid })));
const MediaFiltersPanel = React.lazy(() =>
  import("./MediaFiltersPanel").then((m) => ({ default: m.MediaFiltersPanel })),
);
const MediaUploadEnhanced = React.lazy(() =>
  import("./MediaUploadEnhanced").then((m) => ({ default: m.MediaUploadEnhanced })),
);
const MediaViewerModal = React.lazy(() =>
  import("./MediaViewerModal").then((m) => ({ default: m.MediaViewerModal })),
);

import type { MediaAsset } from "@shared/index";
import { AlertTriangle, PanelLeft, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <GlassCard className="border-red-500/30">
      <div className="px-5 pt-4 pb-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Media Library Error
        </h3>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-4">
          <div className="text-red-400/80 text-sm">
            <p className="mb-2 font-medium">Something went wrong:</p>
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 font-mono text-xs text-red-400">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-red-400 text-sm">Recovery Options:</p>
            <ul className="space-y-1 text-[#68869A] text-sm">
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
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
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
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="center-flex p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-blue-500 border-b-2"></div>
        <p className="text-[#68869A] text-sm">Loading media library...</p>
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

export function MediaLibraryContainerEnhanced({
  selectionMode = false,
  initialFilter = "all",
  onAssetSelect,
}: MediaLibraryContainerEnhancedProps) {
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

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("MediaLibraryContainerEnhanced captured error:", event.error);
    };

    globalThis.addEventListener("error", handleError);
    return () => {
      globalThis.removeEventListener("error", handleError);
    };
  }, []);

  // SURGICAL FIX: Conditional scroll logic - standalone needs internal scroll, dialogs use external
  const isStandalone = !selectionMode;

  const content = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Media Library</h2>
            <p className="text-sm text-[#68869A]">
              Manage your brand assets and sustainable storytelling media.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDatabaseCleanup}
              disabled={isCleaningUp}
              className="hidden sm:flex border border-white/10 bg-white/5 text-[#E3DFD6] hover:bg-white/10 hover:text-white transition-colors"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isCleaningUp && "animate-spin")} />
              {isCleaningUp ? "Cleaning..." : "Sync & Repair"}
            </Button>
            {!isStandalone && (
              <div className="flex items-center gap-2">
                <Separator orientation="vertical" className="h-4 bg-white/10" />
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-400 border-blue-500/30"
                >
                  Selection Active
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaLibraryMainContent
        selectionMode={selectionMode}
        {...(onAssetSelect ? { onAssetSelect } : {})}
        paginationMode={paginationMode}
        isStandalone={isStandalone}
      />
    </div>
  );

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

MediaLibraryContainerEnhanced.displayName = "MediaLibraryContainerEnhanced";

// Separate component to access the context properly
function MediaLibraryMainContent({
  selectionMode = false,
  onAssetSelect,
  isStandalone,
}: {
  selectionMode?: boolean;
  onAssetSelect?: (assetId: number, asset?: MediaAsset) => void;
  paginationMode?: "traditional";
  isStandalone: boolean;
}) {
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
          <div className="hidden w-80 border-r border-white/5 bg-white/[0.02] transition-all duration-300 ease-in-out lg:block">
            <ErrorBoundary
              FallbackComponent={({ resetErrorBoundary }) => (
                <div className="p-4 text-center">
                  <p className="mb-2 text-red-400 text-sm">Filter panel error</p>
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
              className="fixed inset-y-0 left-0 w-80 max-w-md bg-[#121212] shadow-xl sm:max-w-lg border-r border-white/5"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <ErrorBoundary
                FallbackComponent={({ resetErrorBoundary }) => (
                  <div className="p-4 text-center">
                    <p className="mb-2 text-red-400 text-sm">Filter panel error</p>
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
          <div className="shrink-0 border-b border-white/5 p-2">
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
            <div className="shrink-0 border-b border-white/5">
              <ErrorBoundary
                FallbackComponent={({ resetErrorBoundary }) => (
                  <div className="p-4 text-center">
                    <p className="mb-2 text-red-400 text-sm">Upload handler error</p>
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
                  <p className="mb-4 text-red-400 text-sm">Media grid error</p>
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
          <div className="p-4 text-center text-red-400">
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
