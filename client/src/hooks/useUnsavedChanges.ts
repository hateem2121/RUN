import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';

interface UseUnsavedChangesOptions {
  hasChanges: boolean;
  message?: string;
}

export function useUnsavedChanges({
  hasChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?'
}: UseUnsavedChangesOptions) {
  const [location] = useLocation();
  const previousLocationRef = useRef(location);

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
    return undefined;
  }, [hasChanges, message]);

  // Handle browser navigation (back/forward/refresh)
  useEffect(() => {
    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
    return undefined;
  }, [hasChanges, handleBeforeUnload]);

  // Handle in-app navigation
  useEffect(() => {
    if (previousLocationRef.current !== location) {
      if (hasChanges && previousLocationRef.current) {
        const confirmLeave = window.confirm(message);
        if (!confirmLeave) {
          // Prevent navigation by reverting location
          window.history.pushState(null, '', previousLocationRef.current);
          return;
        }
      }
      previousLocationRef.current = location;
    }
  }, [location, hasChanges, message]);

  const confirmNavigation = useCallback((): boolean => {
    if (hasChanges) {
      return window.confirm(message);
    }
    return true;
  }, [hasChanges, message]);

  return {
    confirmNavigation
  };
}