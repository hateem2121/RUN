import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class BentoCardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: `error-${Date.now()}`,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: `error-${Date.now()}`,
    });
  };

  handleRetry = () => {
    this.resetError();

    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    // Add a small delay to prevent rapid retries
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, 100);
  };

  render() {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div
          className={cn(
            "h-full w-full rounded-2xl border border-red-200 bg-red-50",
            "flex flex-col items-center justify-center p-6 text-center",
            "shadow-sm-luxury-sm",
          )}
        >
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>

          <h3 className="mb-2 font-semibold text-lg text-red-800">Something went wrong</h3>

          <p className="mb-4 max-w-xs text-red-600 text-sm">
            {error?.message || "An unexpected error occurred"}
          </p>

          <button
            onClick={this.handleRetry}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2",
              "bg-red-600 font-medium text-sm text-white hover:bg-red-700",
              "transition-colors duration-200",
              "focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>

          {process.env.NODE_ENV === "development" && errorInfo && (
            <details className="mt-4 w-full max-w-md">
              <summary className="cursor-pointer text-red-500 text-xs">Technical Details</summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-red-100 p-2 text-red-700 text-xs">
                {error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default BentoCardErrorBoundary;
