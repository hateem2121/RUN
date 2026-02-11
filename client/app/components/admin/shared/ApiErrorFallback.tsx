import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApiErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  moduleName?: string;
}

export const ApiErrorFallback = React.memo(function ApiErrorFallback({
  error,
  resetErrorBoundary,
  moduleName = "Module",
}: ApiErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/admin");
  };

  const handleReload = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-foreground text-xl capitalize">{moduleName} Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            We encountered an unexpected error while loading the {moduleName.toLowerCase()} module.
            This might be a temporary connection issue.
          </p>

          {error && (
            <div className="text-left">
              <details className="group rounded-md border border-muted bg-muted/30 p-2 text-muted-foreground text-xs transition-all hover:bg-muted/50">
                <summary className="cursor-pointer font-medium outline-none">
                  Technical details
                </summary>
                <div className="mt-2 max-h-32 overflow-auto font-mono text-[10px] leading-relaxed opacity-80 decoration-0">
                  {error.message}
                </div>
              </details>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="gap-2 sm:flex-1 h-9 rounded-full shadow-sm"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleReload}
              className="gap-2 sm:flex-1 h-9 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
