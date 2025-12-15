/**
 * Progressive Loading Hook
 * Manages progressive loading states with delays for hero and secondary content
 */

import { useState, useEffect } from "react";

interface ProgressiveLoadingState {
  isLoading: boolean;
  hasError: boolean;
  heroLoaded: boolean;
  secondaryLoaded: boolean;
}

export function useProgressiveLoading(
  hero: any,
  batchData: any,
  isBatchError: boolean,
): ProgressiveLoadingState {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    // Load hero content immediately
    if (hero && !heroLoaded) {
      const timeout = setTimeout(() => {
        setHeroLoaded(true);
        setIsLoading(false); // Hero is loaded, main loading done
      }, 50); // Minimal delay for smooth UI transition
      timeouts.push(timeout);
    }

    // Load secondary content with delay
    if (batchData && !secondaryLoaded) {
      const timeout = setTimeout(() => {
        setSecondaryLoaded(true);
      }, 100); // Secondary content delay as specified
      timeouts.push(timeout);
    }

    // Handle error states
    if (isBatchError) {
      setHasError(true);
      setIsLoading(false);
    }

    // Cleanup: Clear all timeouts on unmount or dependency change
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [hero, batchData, isBatchError, heroLoaded, secondaryLoaded]);

  return {
    isLoading,
    hasError,
    heroLoaded,
    secondaryLoaded,
  };
}
