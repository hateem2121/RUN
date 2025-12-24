import { AlertTriangle, RotateCcw, Zap } from "lucide-react";
import type React from "react";
import { Component, type ReactNode } from "react";

// GSAP type definitions for error boundary cleanup
// Not augmenting Window interface to avoid conflicts with external type declarations
// Using type guards and runtime checks instead
interface GSAPTimeline {
  kill: () => void;
}

interface GSAPScrollTrigger {
  kill: () => void;
}

interface GSAPInstance {
  globalTimeline?: {
    getChildren: (nested: boolean) => GSAPTimeline[];
  };
  killTweensOf: (targets: string) => void;
  set: (targets: string, vars: Record<string, unknown>) => void;
}

interface ScrollTriggerInstance {
  getAll: () => GSAPScrollTrigger[];
  refresh: () => void;
}

interface AnimationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  // Enhanced error recovery options
  enableGsapCleanup?: boolean;
  enableErrorLogging?: boolean;
  autoRetryDelay?: number;
}

interface AnimationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
  lastErrorTime: number;
}

/**
 * Error Boundary specifically for animation-related failures
 * Catches animation errors and displays fallback UI
 */
export class AnimationErrorBoundary extends Component<
  AnimationErrorBoundaryProps,
  AnimationErrorBoundaryState
> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;
  private cleanupTimeout: NodeJS.Timeout | null = null;

  constructor(props: AnimationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AnimationErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    this.setState({
      error,
      errorInfo,
      lastErrorTime: now,
    });

    // Enhanced GSAP cleanup if enabled
    if (this.props.enableGsapCleanup !== false) {
      this.performGsapCleanup();
    }

    // Enhanced error logging if enabled
    if (this.props.enableErrorLogging !== false) {
      this.logAnimationError(error);
    }

    // Log animation-specific errors
    if (process.env.NODE_ENV === "development") {
    }

    // Auto-retry with delay if configured
    if (this.props.autoRetryDelay && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRetry();
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  // Enhanced GSAP cleanup with comprehensive timeline and scroll trigger management
  private performGsapCleanup = () => {
    try {
      if (typeof window !== "undefined") {
        // Kill all GSAP timelines
        const gsapInstance = (window as any).gsap as GSAPInstance | undefined;
        if (gsapInstance) {
          const timelines = gsapInstance.globalTimeline?.getChildren(true) || [];
          timelines.forEach((tl: GSAPTimeline) => {
            if (tl && typeof tl.kill === "function") {
              tl.kill();
            }
          });

          // Kill all tweens
          gsapInstance.killTweensOf("*");

          // Clear set properties
          gsapInstance.set("*", { clearProps: "all" });
        }

        // Clear ScrollTrigger instances
        const scrollTrigger = (window as any).ScrollTrigger as ScrollTriggerInstance | undefined;
        if (scrollTrigger) {
          scrollTrigger.getAll().forEach((trigger: GSAPScrollTrigger) => {
            if (trigger && typeof trigger.kill === "function") {
              trigger.kill();
            }
          });
          scrollTrigger.refresh();
        }
      }
    } catch (_cleanupError) {}
  };

  // Enhanced error logging with performance metrics
  private logAnimationError = async (error: Error) => {
    try {
      const errorData = {
        componentName: this.props.componentName || "Unknown",
        errorMessage: error.message,
        errorStack: error.stack || null,
        errorBoundary: "AnimationErrorBoundary",
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : null,
        retryCount: this.state.retryCount,
        resolved: false,
      };

      // Log to API in production
      if (process.env.NODE_ENV === "production") {
        await fetch("/api/animation-errors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorData),
        }).catch(() => {}); // Silent fail in error boundary
      }
    } catch (_logError) {}
  };

  // Schedule automatic retry with delay
  private scheduleAutoRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    const delay = this.props.autoRetryDelay || 2000;
    this.setState({ isRecovering: true });

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
      this.setState({ isRecovering: false });
    }, delay);
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      // Perform cleanup before retry
      if (this.props.enableGsapCleanup !== false) {
        this.performGsapCleanup();
      }

      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));
    }
  };

  // Cleanup on unmount
  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }
  }

  private renderFallbackUI() {
    const { fallback, componentName } = this.props;
    const { error, retryCount, isRecovering } = this.state;

    if (fallback) {
      return fallback;
    }

    return (
      <div className="relative rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mb-4 flex items-center justify-center">
          {isRecovering ? (
            <Zap className="mr-2 h-6 w-6 animate-pulse text-blue-500" />
          ) : (
            <AlertTriangle className="mr-2 h-6 w-6 text-red-500" />
          )}
          <h3 className="font-semibold text-lg text-red-800">
            {isRecovering ? "Recovering Animation" : "Animation Error"}
          </h3>
        </div>

        <p className="mb-4 text-red-700">
          {componentName ? `${componentName} animation failed` : "Animation failed to load"}
        </p>

        {process.env.NODE_ENV === "development" && error && (
          <details className="mb-4 rounded border bg-red-100 p-3 text-left">
            <summary className="cursor-pointer font-medium text-red-800">Error Details</summary>
            <div className="mt-2 text-red-700 text-sm">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {retryCount < this.maxRetries && (
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry Animation ({retryCount + 1}/{this.maxRetries})
          </button>
        )}

        {retryCount >= this.maxRetries && (
          <p className="text-red-600 text-sm">Maximum retries reached. Please refresh the page.</p>
        )}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with animation error boundary
 */
export function withAnimationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
) {
  return function WrappedComponent(props: P) {
    return (
      <AnimationErrorBoundary componentName={componentName}>
        <Component {...props} />
      </AnimationErrorBoundary>
    );
  };
}
