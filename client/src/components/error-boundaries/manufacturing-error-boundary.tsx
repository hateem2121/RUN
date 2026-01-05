import { AlertTriangle, RefreshCw } from "lucide-react";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class ManufacturingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Something went wrong
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md text-sm">
              There was an error loading this section. This might be due to
              missing data or a temporary connectivity issue.
            </p>
            <Button
              onClick={this.handleRetry}
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Loading skeleton component
export const ManufacturingLoadingSkeleton = React.memo(
  function ManufacturingLoadingSkeleton() {
    return (
      <div className="animate-pulse">
        <div className="bg-muted/20 mb-4 h-8 w-3/4 rounded-md"></div>
        <div className="bg-muted/20 mb-2 h-4 w-full rounded-md"></div>
        <div className="bg-muted/20 mb-4 h-4 w-2/3 rounded-md"></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-muted/20 h-40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  },
);

// Missing asset placeholder
export const AssetPlaceholder = React.memo(function AssetPlaceholder({
  className = "",
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={`center-flex border-border/50 bg-muted rounded-lg border-2 border-dashed ${className}`}
    >
      <div className="p-4 text-center">
        <AlertTriangle className="text-muted-foreground/70 mx-auto mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">Asset not available</p>
      </div>
    </div>
  );
});
