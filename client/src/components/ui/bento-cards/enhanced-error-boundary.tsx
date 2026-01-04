import { motion } from "framer-motion";
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex h-full min-h-80 w-full flex-col items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center"
        >
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />

          <h3 className="mb-2 font-semibold text-lg text-red-800">Card Error</h3>

          <p className="mb-4 text-red-600 text-sm">Something went wrong while loading this card.</p>

          <div className="flex flex-col gap-2">
            {this.state.retryCount < this.maxRetries && (
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry ({this.maxRetries - this.state.retryCount} left)
              </button>
            )}

            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </div>

          {this.props.showTechnicalDetails && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-red-700 text-sm hover:text-red-800">
                Technical Details
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-red-100 p-2 text-red-600 text-xs">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </motion.div>
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
        <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-surface-emphasis bg-surface-subtle">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-disabled">{message}</p>
          </div>
        </div>
      }
    >
      {children}
    </EnhancedBentoCardErrorBoundary>
  );
}

export default EnhancedBentoCardErrorBoundary;
