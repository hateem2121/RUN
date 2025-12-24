/**
 * Error Boundary for Admin Products sections
 * Prevents cascade failures between product management components
 */

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "./logger";

interface Props {
	children: ReactNode;
	fallbackTitle?: string;
	fallbackMessage?: string;
	sectionName?: string;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: any;
}

export class AdminProductsErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: any) {
		logger.error(
			`Error in ${this.props.sectionName || "admin products section"}`,
			{
				error: error.message,
				stack: error.stack,
				errorInfo,
			},
		);

		this.setState({
			error,
			errorInfo,
		});
	}

	handleReset = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="border border-red-200 rounded-lg p-6 bg-red-50">
					<div className="flex items-center gap-3 mb-4">
						<AlertTriangle className="h-6 w-6 text-red-600" />
						<div>
							<h3 className="font-semibold text-red-900">
								{this.props.fallbackTitle ||
									`${this.props.sectionName || "Section"} Error`}
							</h3>
							<p className="text-sm text-red-700">
								{this.props.fallbackMessage ||
									"This section encountered an error and has been isolated to prevent system-wide issues."}
							</p>
						</div>
					</div>

					{process.env.NODE_ENV === "development" && this.state.error && (
						<details className="mb-4">
							<summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
								Technical Details (Development Only)
							</summary>
							<div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
								<div className="font-semibold">{this.state.error.message}</div>
								<div className="mt-1 text-red-600">
									{this.state.error.stack}
								</div>
							</div>
						</details>
					)}

					<Button
						onClick={this.handleReset}
						variant="outline"
						size="sm"
						className="text-red-700 border-red-300 hover:bg-red-100"
					>
						<RefreshCw className="w-4 h-4 mr-2" />
						Retry Section
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}
