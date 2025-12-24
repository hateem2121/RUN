/**
 * PHASE 3.2: Model-Viewer Error Recovery Hook
 *
 * Dedicated hook file to avoid HMR fast-refresh issues with mixed exports
 */

import React from "react";

/**
 * PHASE 3.2: Hook for programmatic error boundary control
 */
export function useModelViewerErrorRecovery() {
  const [errorBoundaryKey, setErrorBoundaryKey] = React.useState(0);

  const resetErrorBoundary = React.useCallback(() => {
    setErrorBoundaryKey((prev) => prev + 1);
  }, []);

  return {
    errorBoundaryKey,
    resetErrorBoundary,
  };
}
