import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductsErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export const ProductsErrorFallback = React.memo(function ProductsErrorFallback({
  error,
  resetError,
}: ProductsErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/admin");
  };

  const handleReload = () => {
    // If resetError is provided, use it; otherwise refresh the current location
    if (resetError) {
      resetError();
    } else {
      const currentLocation = window.location.pathname;
      navigate("/temp");
      setTimeout(() => navigate(currentLocation), 0);
    }
  };

  return (
    <div className="flex min-h-loading-center items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-foreground text-xl">Products Page Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            The products management page encountered an error and couldn't load properly.
          </p>

          {error && (
            <details className="rounded border bg-background p-3 text-muted-foreground text-xs">
              <summary className="cursor-pointer font-medium">Technical Details</summary>
              <pre className="mt-2 overflow-auto text-left">{error.message}</pre>
            </details>
          )}

          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGoBack} className="gap-2">
              <Home className="h-4 w-4" />
              Back to Admin
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={resetError || handleReload}
              className="gap-2"
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
