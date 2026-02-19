/**
 * PHASE 3.2: Model-Viewer Error Boundary
 *
 * Specialized error boundary for model-viewer components with graceful fallbacks,
 * recovery mechanisms, and meaningful error messages for users.
 */

import type { MediaAsset } from "@shared/schema";
import { AlertCircle, Box, Download, FileX, RefreshCw, Shield } from "lucide-react";
import type React from "react";
import { Component, type ErrorInfo, type ReactNode } from "react";
// Removed unused Alert components import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODEL_VIEWER_ENVIRONMENT } from "@/lib/model-viewer-config";

interface Props {
  children: ReactNode;
  asset?: MediaAsset;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, asset?: MediaAsset) => void;
  onRecovery?: (asset?: MediaAsset) => void;
  showDevDetails?: boolean | undefined;
  resetKeys?: string[] | undefined; // Optional array of keys that trigger reset when changed
  fallbackImage?: string | undefined;
  fallbackVideo?: string | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
  errorId: string;
}

export class ModelViewerErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `mv-error-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to trigger error UI
    return {
      hasError: true,
      error,
      errorId: `mv-error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };
  }

  override componentDidUpdate(prevProps: Props) {
    // PHASE 3.2: Auto-reset on asset change or resetKeys change
    if (this.state.hasError) {
      const assetChanged = prevProps.asset?.id !== this.props.asset?.id;
      const resetKeysChanged =
        this.props.resetKeys &&
        prevProps.resetKeys &&
        this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);

      if (assetChanged || resetKeysChanged) {
        if (MODEL_VIEWER_ENVIRONMENT.isDevelopment) {
          console.log(
            `[ModelViewerErrorBoundary] Auto-recovering due to ${assetChanged ? "asset" : "key"} change`,
          );
        }

        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: 0,
          isRecovering: false,
          errorId: this.generateErrorId(),
        });

        this.props.onRecovery?.(this.props.asset);
      }
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
      hasError: true,
    });

    // Report error to parent handler
    this.props.onError?.(error, errorInfo, this.props.asset);

    // Development logging
    if (MODEL_VIEWER_ENVIRONMENT.isDevelopment) {
      console.error("[ModelViewerErrorBoundary] Caught error:", error, errorInfo);
    }

    // Send to monitoring service (placeholder - replace with actual monitoring)
    if (typeof window !== "undefined" && window.console) {
      console.warn("[ModelViewerErrorBoundary] Error reported to monitoring:", error.message);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({
      isRecovering: true,
    });

    // Clear any existing timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = 1000 * 2 ** this.state.retryCount;

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRecovering: false,
        errorId: this.generateErrorId(),
      });

      this.props.onRecovery?.(this.props.asset);
    }, delay);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      errorId: this.generateErrorId(),
    });

    this.props.onRecovery?.(this.props.asset);
  };

  private getErrorType(error: Error): {
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    suggestion: string;
  } {
    const message = error.message.toLowerCase();

    if (message.includes("fetch") || message.includes("network")) {
      return {
        type: "Network Error",
        icon: AlertCircle,
        color: "text-orange-600",
        suggestion: "Check your internet connection and try again.",
      };
    }

    if (message.includes("gltf") || message.includes("model") || message.includes("texture")) {
      return {
        type: "Model Loading Error",
        icon: Box,
        color: "text-red-600",
        suggestion: "The 3D model file may be corrupted or incompatible.",
      };
    }

    if (message.includes("webgl") || message.includes("gpu")) {
      return {
        type: "Graphics Error",
        icon: Shield,
        color: "text-purple-600",
        suggestion: "Your browser or graphics card may not support this 3D model.",
      };
    }

    return {
      type: "Unknown Error",
      icon: FileX,
      color: "text-text-disabled",
      suggestion: "An unexpected error occurred while loading the model.",
    };
  }

  private renderErrorContent() {
    const { error, retryCount, isRecovering } = this.state;
    const { asset, fallbackImage, fallbackVideo } = this.props;

    if (!error) {
      return null;
    }

    const errorDetails = this.getErrorType(error);
    const IconComponent = errorDetails.icon;
    const canRetry = retryCount < this.maxRetries;
    const showDevDetails = this.props.showDevDetails ?? MODEL_VIEWER_ENVIRONMENT.isDevelopment;

    // Use fallback media if available
    const fallbackSrc = fallbackImage || asset?.thumbnailUrl;

    if (fallbackVideo) {
      return (
        <div className="group relative h-full w-full overflow-hidden rounded-lg bg-black">
          <video
            src={fallbackVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-50"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-2 rounded-full bg-background/80 p-3 text-destructive shadow-sm backdrop-blur-sm">
              <IconComponent className="h-6 w-6" />
            </div>
            <h3 className="mb-1 font-semibold text-white text-sm drop-shadow-md">
              3D Preview Unavailable
            </h3>
            {canRetry && (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this.handleRetry();
                }}
                disabled={isRecovering}
                variant="secondary"
                size="sm"
                className="mt-2"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            )}

            {showDevDetails && (
              <div className="mt-4 max-w-xs rounded bg-background/80 p-2 text-xs backdrop-blur-sm text-left">
                <div className="font-mono text-destructive">{error.message}</div>
                {this.state.errorInfo && (
                  <div className="mt-1 text-[10px] text-muted-foreground truncate">
                    {this.state.errorInfo.componentStack?.slice(0, 100)}...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (fallbackSrc) {
      return (
        <div className="group relative h-full w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={fallbackSrc}
            alt="3D Model Fallback"
            className="h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-2 rounded-full bg-background/80 p-3 text-destructive shadow-sm backdrop-blur-sm">
              <IconComponent className="h-6 w-6" />
            </div>
            <h3 className="mb-1 font-semibold text-foreground text-sm">3D Preview Unavailable</h3>
            {canRetry && (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this.handleRetry();
                }}
                disabled={isRecovering}
                variant="secondary"
                size="sm"
                className="mt-2"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            )}

            {showDevDetails && (
              <div className="mt-4 max-w-xs rounded bg-background/80 p-2 text-xs backdrop-blur-sm text-left">
                <div className="font-mono text-destructive">{error.message}</div>
                {this.state.errorInfo && (
                  <div className="mt-1 text-[10px] text-muted-foreground truncate">
                    {this.state.errorInfo.componentStack?.slice(0, 100)}...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <Card className="border-destructive/20 bg-destructive/5 mx-auto w-full max-w-md">
        <CardHeader className="pb-4 text-center">
          <div
            className={`bg-destructive/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full`}
          >
            <IconComponent className={`h-6 w-6 ${errorDetails.color}`} />
          </div>
          <CardTitle className="text-destructive text-lg font-semibold">
            {errorDetails.type}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {errorDetails.suggestion}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Asset Info */}
          {asset && (
            <div className="bg-muted/50 text-muted-foreground rounded p-2 text-xs">
              <div className="font-medium">{asset.filename || "Unknown file"}</div>
              {asset.id && <div>Asset ID: {asset.id}</div>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {canRetry && (
              <Button
                onClick={this.handleRetry}
                disabled={isRecovering}
                variant="default"
                size="sm"
                className="w-full"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying... ({retryCount + 1}/{this.maxRetries})
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again ({retryCount}/{this.maxRetries})
                  </>
                )}
              </Button>
            )}

            <Button onClick={this.handleReset} variant="outline" size="sm" className="w-full">
              <Box className="mr-2 h-4 w-4" />
              Reset Viewer
            </Button>

            {asset?.url && (
              <Button
                onClick={() => window.open(asset.url, "_blank")}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Model
              </Button>
            )}
          </div>

          {/* Development Details */}
          {showDevDetails && (
            <details className="text-xs">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
                Developer Details
              </summary>
              <div className="bg-muted/30 mt-2 rounded border p-2">
                <div className="font-medium">Error Message:</div>
                <div className="mb-2 font-mono break-all text-red-600">{error.message}</div>

                <div className="font-medium">Error ID:</div>
                <div className="text-muted-foreground mb-2 font-mono break-all">
                  {this.state.errorId}
                </div>

                {error.stack && (
                  <>
                    <div className="font-medium">Stack Trace:</div>
                    <pre className="bg-muted/50 text-muted-foreground max-h-32 overflow-x-auto rounded p-1 text-xs">
                      {error.stack.slice(0, 1000)}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  override componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <div className="flex h-full w-full min-h-[300px] items-center justify-center p-4">
          {this.renderErrorContent()}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * PHASE 3.2: Higher-order component for easy error boundary wrapping
 */
export function withModelViewerErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>,
) {
  return function WrappedComponent(props: P) {
    return (
      <ModelViewerErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ModelViewerErrorBoundary>
    );
  };
}
