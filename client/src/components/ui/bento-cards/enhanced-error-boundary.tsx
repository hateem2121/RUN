import { motion } from "framer-motion";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	showTechnicalDetails?: boolean;
	onRetry?: () => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	retryCount: number;
}

export class EnhancedBentoCardErrorBoundary extends Component<Props, State> {
	private maxRetries = 3;

	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({
			error,
			errorInfo,
		});
	}

	handleRetry = () => {
		if (this.state.retryCount < this.maxRetries) {
			this.setState((prevState) => ({
				hasError: false,
				error: null,
				errorInfo: null,
				retryCount: prevState.retryCount + 1,
			}));

			this.props.onRetry?.();
		}
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="relative w-full h-full min-h-[320px] rounded-2xl border-2 border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-center"
				>
					<AlertTriangle className="w-12 h-12 text-red-500 mb-4" />

					<h3 className="text-lg font-semibold text-red-800 mb-2">
						Card Error
					</h3>

					<p className="text-red-600 text-sm mb-4">
						Something went wrong while loading this card.
					</p>

					<div className="flex flex-col gap-2">
						{this.state.retryCount < this.maxRetries && (
							<button
								onClick={this.handleRetry}
								className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
							>
								<RefreshCw className="w-4 h-4" />
								Retry ({this.maxRetries - this.state.retryCount} left)
							</button>
						)}

						<button
							onClick={() => (window.location.href = "/")}
							className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
						>
							<Home className="w-4 h-4" />
							Go Home
						</button>
					</div>

					{this.props.showTechnicalDetails && this.state.error && (
						<details className="mt-4 w-full">
							<summary className="text-sm text-red-700 cursor-pointer hover:text-red-800">
								Technical Details
							</summary>
							<pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
								{this.state.error.toString()}
								{this.state.errorInfo?.componentStack}
							</pre>
						</details>
					)}
				</motion.div>
			);
		}

		return this.props.children;
	}
}

// Simplified version for basic use cases
export function SimpleErrorBoundary({
	children,
	message = "Something went wrong",
}: {
	children: ReactNode;
	message?: string;
}) {
	return (
		<EnhancedBentoCardErrorBoundary
			fallback={
				<div className="flex items-center justify-center h-full min-h-[200px] rounded-lg bg-gray-100 border border-gray-300">
					<div className="text-center">
						<AlertTriangle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
						<p className="text-gray-600 text-sm">{message}</p>
					</div>
				</div>
			}
		>
			{children}
		</EnhancedBentoCardErrorBoundary>
	);
}

export default EnhancedBentoCardErrorBoundary;
