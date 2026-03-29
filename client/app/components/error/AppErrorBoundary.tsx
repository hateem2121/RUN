import { AlertTriangle, RefreshCw } from "lucide-react";
import type { FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

export const AppErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const version = import.meta.env.VITE_APP_VERSION || "unknown";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="font-bold text-2xl text-foreground tracking-tight">Something went wrong</h1>

        <p className="text-muted-foreground">
          We've encountered an unexpected error while rendering the application. Our team has been
          notified.
        </p>

        <div className="max-h-48 overflow-auto rounded-lg bg-muted p-4 text-left">
          <p className="break-all font-mono text-muted-foreground text-xs">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={resetErrorBoundary} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>

        <div className="border-border border-t pt-8">
          <p className="text-micro text-muted-foreground">Build: {version}</p>
        </div>
      </div>
    </div>
  );
};
