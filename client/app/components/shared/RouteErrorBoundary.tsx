import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

/**
 * Standard Error Boundary for feature routes.
 * Isolates errors to the page content area while keeping the main layout intact.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Something went wrong";
  let message = "An unexpected error occurred while loading this page.";
  let detail: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || "We couldn't find what you were looking for.";
  } else if (error instanceof Error) {
    message = error.message;
    detail = error.stack;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-custom-space-202 p-6 text-center animate-in fade-in duration-500">
      <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-6 shadow-sm border border-destructive/20">
        <AlertCircle size={40} />
      </div>

      <Typography.H2 className="mb-2">{title}</Typography.H2>
      <Typography.P className="text-muted-foreground max-w-md mx-auto mb-8">{message}</Typography.P>

      {import.meta.env.DEV && detail && (
        <div className="w-full max-w-3xl mb-8 p-4 bg-muted rounded-lg text-left overflow-auto max-h-60 border">
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
            {detail}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          variant="default"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </div>
    </div>
  );
}
