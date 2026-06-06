import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showTechnicalDetails?: boolean | undefined;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class EnhancedBentoCardErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));

      this.props.onRetry?.();
    }
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="animate-fade-in relative flex h-full min-h-80 w-full flex-col items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />

          <h3 className="mb-2 text-lg font-semibold text-red-800">Card Error</h3>

          <p className="mb-4 text-sm text-red-600">Something went wrong while loading this card.</p>

          <div className="flex flex-col gap-2">
            {this.state.retryCount < this.maxRetries && (
              <button
                aria-label="Action button"
                type="button"
                onClick={this.handleRetry}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry ({this.maxRetries - this.state.retryCount} left)
              </button>
            )}

            <button
              aria-label="Action button"
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2 rounded-lg px-4 py-2 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </div>

          {this.props.showTechnicalDetails && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800">
                Technical Details
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-red-100 p-2 text-xs text-red-600">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Simplified version for basic use cases
export function SimpleErrorBoundary({
  children,
  message = "Something went wrong",
}: {
  children: ReactNode;
  message?: string | undefined;
}) {
  return (
    <EnhancedBentoCardErrorBoundary
      fallback={
        <div className="border-surface-emphasis bg-surface-subtle flex h-full min-h-48 items-center justify-center rounded-lg border">
          <div className="text-center">
            <AlertTriangle className="text-text-muted mx-auto mb-2 h-8 w-8" />
            <p className="text-text-disabled text-sm">{message}</p>
          </div>
        </div>
      }
    >
      {children}
    </EnhancedBentoCardErrorBoundary>
  );
}
