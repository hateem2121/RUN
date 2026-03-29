import { Box, RefreshCw } from "lucide-react";
import type React from "react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/errorReporter";

interface GLTF3DErrorBoundaryProps {
  children: ReactNode;
  fallbackMesh?: ReactNode;
  assetUrl?: string;
  onRetry?: () => void;
}

interface GLTF3DErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Error Boundary for 3D GLTF/GLB model loading failures
 * Provides graceful fallback UI and retry functionality
 */
export class GLTF3DErrorBoundary extends Component<
  GLTF3DErrorBoundaryProps,
  GLTF3DErrorBoundaryState
> {
  private maxRetries = 3;

  constructor(props: GLTF3DErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GLTF3DErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to error tracking
    reportClientError({
      message: error.message,
      level: "error",
      context: {
        boundary: "GLTF3D",
        assetUrl: this.props.assetUrl,
        retryCount: this.state.retryCount,
      },
      ...(error.stack ? { stack: error.stack } : {}),
      ...(errorInfo.componentStack ? { componentStack: errorInfo.componentStack } : {}),
    });
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
    this.props.onRetry?.();
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackMesh) {
        return this.props.fallbackMesh;
      }

      // Default fallback UI
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-muted">
          <Box className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-muted-foreground">3D model failed to load</p>
          {this.state.error && (
            <p className="mb-4 max-w-xs text-center text-xs text-muted-foreground/70">
              {this.state.error.message}
            </p>
          )}
          {this.state.retryCount < this.maxRetries ? (
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry ({this.state.retryCount + 1}/{this.maxRetries})
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Maximum retries reached</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
