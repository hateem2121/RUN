/**
 * Offline Detection Hook
 * Provides real-time online/offline status using useSyncExternalStore for React 19 compatibility
 */

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  // Assume online during SSR
  return true;
}

/**
 * Hook to detect offline status
 * @returns true if the browser is offline, false if online
 *
 * @example
 * const isOffline = useOfflineStatus();
 * if (isOffline) {
 *   return <OfflineIndicator />;
 * }
 */
export function useOfflineStatus(): boolean {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return !isOnline;
}
