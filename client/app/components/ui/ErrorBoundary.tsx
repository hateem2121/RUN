import { AlertTriangle, RefreshCw } from "lucide-react";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  componentName?: string | undefined;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      // biome-ignore lint/suspicious/noExplicitAny: State reset
      error: null as any,
      // biome-ignore lint/suspicious/noExplicitAny: State reset
      errorInfo: null as any,
    });
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-700">Something went wrong</CardTitle>
            </div>
            <CardDescription className="text-red-600">
              {this.props.componentName
                ? `An error occurred in the ${this.props.componentName} component.`
                : "An unexpected error occurred."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="rounded border border-red-200 bg-red-100 p-3">
                  <p className="mb-2 text-sm font-medium text-red-800">Error Details:</p>
                  <p className="font-mono text-xs break-all text-red-700">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-red-600">
                        Component Stack
                      </summary>
                      <pre className="mt-1 text-xs whitespace-pre-wrap text-red-700">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
}

// Simple error boundary wrapper component
export function WithErrorBoundary({
  children,
  componentName,
  fallback,
}: {
  children: ReactNode;
  componentName?: string | undefined;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary componentName={componentName} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
