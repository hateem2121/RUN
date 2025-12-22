/**
 * PHASE 3.2: Model-Viewer Error Boundary
 * 
 * Specialized error boundary for model-viewer components with graceful fallbacks,
 * recovery mechanisms, and meaningful error messages for users.
 */

import type { MediaAsset } from '@shared/schema';
import { 
  AlertCircle, 
  Box, 
  Download,
  FileX, 
  RefreshCw, 
  Shield
} from 'lucide-react';
import type React from 'react';
import { Component, type ErrorInfo, type ReactNode } from 'react'
// Removed unused Alert components import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODEL_VIEWER_ENVIRONMENT } from '@/lib/model-viewer-config';

interface Props {
  children: ReactNode;
  asset?: MediaAsset;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, asset?: MediaAsset) => void;
  onRecovery?: (asset?: MediaAsset) => void;
  showDevDetails?: boolean;
  resetKeys?: string[]; // Optional array of keys that trigger reset when changed
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
  errorId: string;
}

export class ModelViewerErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `mv-error-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to trigger error UI
    return {
      hasError: true,
      error,
      errorId: `mv-error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };
  }

  componentDidUpdate(prevProps: Props) {
    // PHASE 3.2: Auto-reset on asset change or resetKeys change
    if (this.state.hasError) {
      const assetChanged = prevProps.asset?.id !== this.props.asset?.id;
      const resetKeysChanged = this.props.resetKeys && prevProps.resetKeys && 
        this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);
      
      if (assetChanged || resetKeysChanged) {
        if (MODEL_VIEWER_ENVIRONMENT.isDevelopment) {
          console.log('[ModelViewerErrorBoundary] Auto-resetting due to asset/key change:', {
            assetChanged,
            resetKeysChanged,
            oldAssetId: prevProps.asset?.id,
            newAssetId: this.props.asset?.id
          });
        }
        
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: 0,
          isRecovering: false,
          errorId: this.generateErrorId()
        });
        
        this.props.onRecovery?.(this.props.asset);
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Report error to parent handler
    this.props.onError?.(error, errorInfo, this.props.asset);

    // Development logging
    if (MODEL_VIEWER_ENVIRONMENT.isDevelopment) {
      console.group('[ModelViewerErrorBoundary] Error Caught');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Asset:', this.props.asset);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Production error reporting (lightweight)
    if (!MODEL_VIEWER_ENVIRONMENT.isDevelopment && MODEL_VIEWER_ENVIRONMENT.logging.enableErrorReporting) {
      this.reportErrorToMonitoring(error, errorInfo);
    }
  }

  private reportErrorToMonitoring(error: Error, errorInfo: ErrorInfo) {
    // Lightweight production error tracking
    const errorReport = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack?.slice(0, 500), // Truncate stack trace
      assetId: this.props.asset?.id,
      assetFilename: this.props.asset?.filename,
      componentStack: errorInfo.componentStack?.slice(0, 300), // Truncate component stack
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Send to monitoring service (placeholder - replace with actual monitoring)
    if (typeof window !== 'undefined' && window.console) {
      console.warn('[ModelViewer] Error Report:', errorReport);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ 
      isRecovering: true 
    });

    // Clear any existing timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = 1000 * 2 ** this.state.retryCount;

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRecovering: false,
        errorId: this.generateErrorId()
      });

      this.props.onRecovery?.(this.props.asset);
    }, delay);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      errorId: this.generateErrorId()
    });

    this.props.onRecovery?.(this.props.asset);
  };

  private getErrorType(error: Error): {
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    suggestion: string;
  } {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network')) {
      return {
        type: 'Network Error',
        icon: AlertCircle,
        color: 'text-orange-600',
        suggestion: 'Check your internet connection and try again.'
      };
    }
    
    if (message.includes('gltf') || message.includes('model') || message.includes('texture')) {
      return {
        type: 'Model Loading Error',
        icon: Box,
        color: 'text-red-600',
        suggestion: 'The 3D model file may be corrupted or incompatible.'
      };
    }
    
    if (message.includes('webgl') || message.includes('gpu')) {
      return {
        type: 'Graphics Error',
        icon: Shield,
        color: 'text-purple-600',
        suggestion: 'Your browser or graphics card may not support this 3D model.'
      };
    }
    
    return {
      type: 'Unknown Error',
      icon: FileX,
      color: 'text-gray-600',
      suggestion: 'An unexpected error occurred while loading the model.'
    };
  }

  private renderErrorContent() {
    const { error, retryCount, isRecovering } = this.state;
    const { asset } = this.props;
    
    if (!error) return null;

    const errorDetails = this.getErrorType(error);
    const IconComponent = errorDetails.icon;
    const canRetry = retryCount < this.maxRetries;
    const showDevDetails = this.props.showDevDetails ?? MODEL_VIEWER_ENVIRONMENT.isDevelopment;

    return (
      <Card className="w-full max-w-md mx-auto border-destructive/20 bg-destructive/5">
        <CardHeader className="text-center pb-4">
          <div className={`mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3`}>
            <IconComponent className={`w-6 h-6 ${errorDetails.color}`} />
          </div>
          <CardTitle className="text-lg font-semibold text-destructive">
            {errorDetails.type}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {errorDetails.suggestion}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Asset Info */}
          {asset && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <div className="font-medium">{asset.filename || 'Unknown file'}</div>
              {asset.id && <div>Asset ID: {asset.id}</div>}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {canRetry && (
              <Button 
                onClick={this.handleRetry} 
                disabled={isRecovering}
                variant="default"
                size="sm"
                className="w-full"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying... ({retryCount + 1}/{this.maxRetries})
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({retryCount}/{this.maxRetries})
                  </>
                )}
              </Button>
            )}
            
            <Button 
              onClick={this.handleReset} 
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Box className="w-4 h-4 mr-2" />
              Reset Viewer
            </Button>
            
            {asset?.url && (
              <Button 
                onClick={() => window.open(asset.url, '_blank')}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Model
              </Button>
            )}
          </div>
          
          {/* Development Details */}
          {showDevDetails && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Developer Details
              </summary>
              <div className="mt-2 p-2 bg-muted/30 rounded border">
                <div className="font-medium">Error Message:</div>
                <div className="text-red-600 font-mono break-all mb-2">{error.message}</div>
                
                <div className="font-medium">Error ID:</div>
                <div className="text-muted-foreground font-mono break-all mb-2">{this.state.errorId}</div>
                
                {error.stack && (
                  <>
                    <div className="font-medium">Stack Trace:</div>
                    <pre className="text-xs text-muted-foreground bg-muted/50 p-1 rounded overflow-x-auto max-h-32">
                      {error.stack.slice(0, 1000)}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }
      
      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[300px] p-4">
          {this.renderErrorContent()}
        </div>
      );
    }

    return this.props.children;
  }
}


/**
 * PHASE 3.2: Higher-order component for easy error boundary wrapping
 */
export function withModelViewerErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  return function WrappedComponent(props: P) {
    return (
      <ModelViewerErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ModelViewerErrorBoundary>
    );
  };
}