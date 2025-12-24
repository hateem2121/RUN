import { AlertTriangle, RefreshCw } from "lucide-react";
import type { FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

export const AppErrorFallback = ({
	error,
	resetErrorBoundary,
}: FallbackProps) => {
	const version = (import.meta as any).env?.VITE_APP_VERSION || "unknown";

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
			<div className="max-w-md w-full flex flex-col gap-6">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-2">
					<AlertTriangle className="w-8 h-8" />
				</div>

				<h1 className="text-2xl font-bold tracking-tight text-foreground">
					Something went wrong
				</h1>

				<p className="text-muted-foreground">
					We've encountered an unexpected error while rendering the application.
					Our team has been notified.
				</p>

				<div className="p-4 bg-muted rounded-lg text-left overflow-auto max-h-48">
					<p className="text-xs font-mono text-muted-foreground break-all">
						{error.message}
					</p>
				</div>

				<div className="flex flex-col gap-3">
					<Button onClick={resetErrorBoundary} className="w-full gap-2">
						<RefreshCw className="w-4 h-4" />
						Try Again
					</Button>
				</div>

				<div className="pt-8 border-t border-border">
					<p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
						Build: {version}
					</p>
				</div>
			</div>
		</div>
	);
};
