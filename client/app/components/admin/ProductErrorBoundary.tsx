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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-12 backdrop-blur-xl">
          <div className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-red-glow">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white tracking-tight">System Protocol Violation</h2>
          <p className="mb-6 max-w-md text-center text-sm text-admin-muted">
            {this.state.error?.message ||
              "An unexpected exception has occurred in the product management subsystem."}
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            className="flex items-center gap-2 h-11 px-6 rounded-xl border-white/10 hover:bg-white/5 text-admin-foreground transition-all active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Re-initiate Module
          </Button>
          {process.env.NODE_ENV === "development" && this.state.errorInfo && (
            <details className="bg-muted mt-4 rounded p-4 text-xs">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 overflow-auto">{this.state.errorInfo.componentStack}</pre>
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
