import { AlertCircle, RefreshCw } from "lucide-react";
import type React from "react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ProductErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8">
          <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
          <h2 className="mb-2 text-lg font-semibold text-red-900">
            Something went wrong
          </h2>
          <p className="mb-4 max-w-md text-center text-sm text-red-700">
            {this.state.error?.message ||
              "An unexpected error occurred in the product management system"}
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          {process.env.NODE_ENV === "development" && this.state.errorInfo && (
            <details className="bg-muted mt-4 rounded p-4 text-xs">
              <summary className="cursor-pointer font-medium">
                Error Details
              </summary>
              <pre className="mt-2 overflow-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping async operations
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
): React.ComponentType<P> {
  return (props: P) => (
    <ProductErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ProductErrorBoundary>
  );
}
