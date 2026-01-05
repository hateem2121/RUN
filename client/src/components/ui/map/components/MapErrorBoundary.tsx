import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-muted/20 flex h-128 w-full items-center justify-center rounded-2xl">
            <div className="p-8 text-center">
              <div className="text-muted-foreground mb-4">
                <svg
                  className="mx-auto mb-4 h-16 w-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                  />
                </svg>
                <h3 className="mb-2 text-lg font-semibold">
                  Map Temporarily Unavailable
                </h3>
                <p className="text-sm">
                  Our global presence map is experiencing technical
                  difficulties. Please try refreshing the page.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
