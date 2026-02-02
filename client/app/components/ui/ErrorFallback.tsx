import { AlertTriangle, RefreshCw } from "lucide-react";
import type React from "react";
import type { FallbackProps } from "react-error-boundary";
import { Button } from "./button";

export const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="fade-in zoom-in flex h-loading-content w-full animate-in flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center duration-300">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="font-bold text-xl tracking-tight">Something went wrong</h2>
      <p className="max-w-md text-muted-foreground text-sm">
        {(error as any).message || "An unexpected error occurred while rendering this component."}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );
};
