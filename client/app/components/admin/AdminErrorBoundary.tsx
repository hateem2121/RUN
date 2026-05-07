import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";

export function AdminErrorBoundary() {
  const error = useRouteError();

  let errorMessage = "An unexpected error occurred within the Admin Console.";
  let errorDetail = "";

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}`;
    errorDetail = error.data?.message || "Route error details unavailable.";
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetail = error.stack || "";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-admin-error p-8 text-center bg-background border rounded-lg shadow-sm border-destructive/20 m-4">
      <div className="p-4 rounded-full bg-destructive/10 mb-6 text-destructive">
        <AlertCircle size={48} />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Admin Console Error
      </h2>

      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{errorMessage}</p>

      {process.env.NODE_ENV === "development" && errorDetail && (
        <div className="w-full max-w-2xl bg-muted p-4 rounded-md text-left overflow-auto mb-8 max-h-48 border border-muted-foreground/20">
          <pre className="text-xs font-mono text-muted-foreground">{errorDetail}</pre>
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          variant="default"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Retry Operation
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            window.location.href = "/";
          }}
          className="flex items-center gap-2"
        >
          <Home size={16} />
          Back to Website
        </Button>
      </div>
    </div>
  );
}
