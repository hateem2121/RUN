import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

interface ProductsErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export const ProductsErrorFallback = React.memo(function ProductsErrorFallback({ error, resetError }: ProductsErrorFallbackProps) {
  const [, setLocation] = useLocation();
  
  const handleGoBack = () => {
    setLocation('/admin');
  };

  const handleReload = () => {
    // If resetError is provided, use it; otherwise refresh the current location
    if (resetError) {
      resetError();
    } else {
      const currentLocation = window.location.pathname;
      setLocation('/temp');
      setTimeout(() => setLocation(currentLocation), 0);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Products Page Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            The products management page encountered an error and couldn't load properly.
          </p>
          
          {error && (
            <details className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
              <summary className="cursor-pointer font-medium">Technical Details</summary>
              <pre className="mt-2 text-left overflow-auto">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGoBack}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Admin
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={resetError || handleReload}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});