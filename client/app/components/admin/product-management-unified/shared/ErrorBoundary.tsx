/**
 * Error Boundary for Admin Products sections
 * Prevents cascade failures between product management components
 */

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "./logger";

interface Props {
  children: ReactNode;
  fallbackTitle?: string | undefined;
  fallbackMessage?: string | undefined;
  sectionName?: string | undefined;
}

interface State {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
}

export class AdminProductsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Error in ${this.props.sectionName || "admin products section"}`, {
      error: error.message,
      stack: error.stack,
      errorInfo,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">
                {this.props.fallbackTitle || `${this.props.sectionName || "Section"} Error`}
              </h3>
              <p className="text-sm text-red-700">
                {this.props.fallbackMessage ||
                  "This section encountered an error and has been isolated to prevent system-wide issues."}
              </p>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                Technical Details (Development Only)
              </summary>
              <div className="mt-2 max-h-32 overflow-auto rounded bg-red-100 p-3 font-mono text-xs text-red-800">
                <div className="font-semibold">{this.state.error.message}</div>
                <div className="mt-1 text-red-600">{this.state.error.stack}</div>
              </div>
            </details>
          )}

          <Button
            onClick={this.handleReset}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
