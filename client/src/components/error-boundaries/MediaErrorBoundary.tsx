import { AlertCircle, Home, RefreshCw } from "lucide-react";
import type React from "react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MediaErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	context?: string;
	showRetry?: boolean;
}

interface MediaErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	retryCount: number;
	lastErrorTime: number;
}

export class MediaErrorBoundary extends Component<
	MediaErrorBoundaryProps,
	MediaErrorBoundaryState
> {
	private retryTimeout: NodeJS.Timeout | null = null;

	constructor(props: MediaErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			retryCount: 0,
			lastErrorTime: 0,
		};
	}

	static getDerivedStateFromError(
		error: Error,
	): Partial<MediaErrorBoundaryState> {
		return {
			hasError: true,
			error,
			lastErrorTime: Date.now(),
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Auto-retry mechanism for transient errors
		if (this.isTransientError(error) && this.state.retryCount < 3) {
			this.scheduleRetry();
		}
	}

	private isTransientError(error: Error): boolean {
		const transientMessages = [
			"Failed to fetch",
			"Network request failed",
			"Load failed",
			"ChunkLoadError",
			"Loading chunk",
		];

		return transientMessages.some((msg) =>
			error.message.toLowerCase().includes(msg.toLowerCase()),
		);
	}

	private scheduleRetry = () => {
		if (this.retryTimeout) {
			clearTimeout(this.retryTimeout);
		}

		// Exponential backoff: 1s, 2s, 4s
		const delay = 2 ** this.state.retryCount * 1000;

		this.retryTimeout = setTimeout(() => {
			this.setState((prevState) => ({
				hasError: false,
				error: null,
				retryCount: prevState.retryCount + 1,
			}));
		}, delay);
	};

	private handleManualRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			retryCount: 0,
			lastErrorTime: 0,
		});
	};

	private handleGoHome = () => {
		window.location.href = "/";
	};

	componentWillUnmount() {
		if (this.retryTimeout) {
			clearTimeout(this.retryTimeout);
		}
	}

	render() {
		if (this.state.hasError) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<Card className="w-full max-w-md mx-auto my-4">
					<CardHeader className="text-center">
						<div className="flex justify-center mb-4">
							<AlertCircle className="h-12 w-12 text-red-500" />
						</div>
						<CardTitle className="text-lg">Media Loading Error</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-sm text-muted-foreground">
							{this.props.context
								? `Error in ${this.props.context}`
								: "Something went wrong loading this media content."}
						</p>

						{this.state.error && (
							<details className="text-xs text-left bg-muted p-2 rounded">
								<summary className="cursor-pointer font-medium">
									Error Details
								</summary>
								<pre className="mt-2 whitespace-pre-wrap">
									{this.state.error.message}
								</pre>
							</details>
						)}

						<div className="flex gap-2 justify-center">
							{this.props.showRetry !== false && (
								<Button
									variant="outline"
									size="sm"
									onClick={this.handleManualRetry}
									disabled={this.state.retryCount >= 3}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									{this.state.retryCount >= 3 ? "Max Retries" : "Retry"}
								</Button>
							)}

							<Button variant="default" size="sm" onClick={this.handleGoHome}>
								<Home className="h-4 w-4 mr-2" />
								Home
							</Button>
						</div>

						{this.state.retryCount > 0 && (
							<p className="text-xs text-muted-foreground">
								Retry attempts: {this.state.retryCount}/3
							</p>
						)}
					</CardContent>
				</Card>
			);
		}

		return this.props.children;
	}
}

// Specialized error boundaries for different media contexts
export const MediaGalleryErrorBoundary: React.FC<{ children: ReactNode }> = ({
	children,
}) => (
	<MediaErrorBoundary context="Media Gallery" onError={(error) => {}}>
		{children}
	</MediaErrorBoundary>
);

export const MediaViewerErrorBoundary: React.FC<{ children: ReactNode }> = ({
	children,
}) => (
	<MediaErrorBoundary
		context="Media Viewer"
		fallback={
			<div className="flex items-center justify-center h-64 bg-muted rounded-lg">
				<div className="text-center">
					<AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
					<p className="text-sm text-muted-foreground">
						Media viewer unavailable
					</p>
				</div>
			</div>
		}
	>
		{children}
	</MediaErrorBoundary>
);

export const MediaGridErrorBoundary: React.FC<{ children: ReactNode }> = ({
	children,
}) => (
	<MediaErrorBoundary
		context="Media Grid"
		fallback={
			<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
				{[...Array(8)].map((_, i) => (
					<div
						key={i}
						className="aspect-square bg-muted rounded-lg flex items-center justify-center"
					>
						<AlertCircle className="h-6 w-6 text-muted-foreground" />
					</div>
				))}
			</div>
		}
	>
		{children}
	</MediaErrorBoundary>
);

export const MediaUploadErrorBoundary: React.FC<{ children: ReactNode }> = ({
	children,
}) => (
	<MediaErrorBoundary
		context="Media Upload"
		showRetry={true}
		onError={(error) => {}}
	>
		{children}
	</MediaErrorBoundary>
);
