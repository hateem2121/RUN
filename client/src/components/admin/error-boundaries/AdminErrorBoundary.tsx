/**
 * Frontend Error Boundary for Admin Modules
 * Provides graceful error handling and recovery UI
 */

import { AlertTriangle, ArrowLeft, Bug, RefreshCw } from "lucide-react";
import type React from "react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  module: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorHistory: Array<{
    error: Error;
    timestamp: Date;
    userAgent: string;
  }>;
}

export class AdminErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorHistory: [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error information
    this.setState((prevState) => ({
      errorInfo,
      errorHistory: [
        ...prevState.errorHistory.slice(-4), // Keep last 5 errors
        {
          error,
          timestamp: new Date(),
          userAgent: navigator.userAgent,
        },
      ],
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Send error report to backend for analysis
    fetch("/api/admin/error-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        module: this.props.module,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    }).catch((_reportError) => {});
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private getErrorSeverity = (error: Error): "low" | "medium" | "high" | "critical" => {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) return "high";
    if (message.includes("permission") || message.includes("auth")) return "critical";
    if (message.includes("validation") || message.includes("parse")) return "medium";
    return "low";
  };

  private getErrorCategory = (error: Error): string => {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) return "Network Error";
    if (message.includes("permission") || message.includes("auth")) return "Authentication Error";
    if (message.includes("validation")) return "Validation Error";
    if (message.includes("parse") || message.includes("json")) return "Data Format Error";
    return "Application Error";
  };

  private getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity(this.state.error);
      const category = this.getErrorCategory(this.state.error);
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-red-900">
                    Error in {this.props.module} Module
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <Badge
                      variant={
                        this.getSeverityColor(severity) as "destructive" | "secondary" | "outline"
                      }
                    >
                      {severity.toUpperCase()}
                    </Badge>
                    <span>{category}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="mb-2 font-medium text-red-900">Error Details</h4>
                <p className="font-mono text-red-700 text-sm">{this.state.error.message}</p>
              </div>

              {/* Recovery Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Recovery Options</h4>

                <div className="flex flex-wrap gap-3">
                  {canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry ({this.maxRetries - this.state.retryCount} attempts left)
                    </Button>
                  )}

                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Module
                  </Button>

                  <Button
                    onClick={this.handleGoBack}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                  </Button>
                </div>
              </div>

              {/* Error History (for debugging) */}
              {this.state.errorHistory.length > 1 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                    Recent Error History ({this.state.errorHistory.length} errors)
                  </summary>
                  <div className="mt-2 max-h-32 space-y-2 overflow-y-auto">
                    {this.state.errorHistory.slice(-3).map((entry, index) => (
                      <div key={index} className="rounded bg-gray-50 p-2 text-xs">
                        <div className="font-mono text-gray-700">{entry.error.message}</div>
                        <div className="mt-1 text-gray-500">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">What happened?</h4>
                <p className="text-blue-700 text-sm">
                  The {this.props.module} module encountered an unexpected error. This could be due
                  to a network issue, data problem, or temporary service interruption.
                  {canRetry && " Try the retry button to attempt the operation again."}
                </p>
              </div>

              {/* Debug Information (development only) */}
              {process.env.NODE_ENV === "development" && (
                <details className="text-xs">
                  <summary className="flex cursor-pointer items-center gap-1 text-gray-500 hover:text-gray-700">
                    <Bug className="h-3 w-3" />
                    Debug Information
                  </summary>
                  <div className="mt-2 max-h-40 overflow-auto rounded bg-gray-900 p-3 text-gray-100">
                    <pre>{this.state.error.stack}</pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Factory functions for specific admin modules
export const ProductsErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AdminErrorBoundary module="Products">{children}</AdminErrorBoundary>
);

export const CategoriesErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AdminErrorBoundary module="Categories">{children}</AdminErrorBoundary>
);

export const MediaErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AdminErrorBoundary module="Media Library">{children}</AdminErrorBoundary>
);

export const FabricErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AdminErrorBoundary module="Fabric Management">{children}</AdminErrorBoundary>
);

export const FiberErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AdminErrorBoundary module="Fiber Management">{children}</AdminErrorBoundary>
);
