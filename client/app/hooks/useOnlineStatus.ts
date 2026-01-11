import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Hook to track browser online/offline status
 * Uses useSyncExternalStore for concurrent-safe subscriptions
 *
 * @returns boolean indicating if the browser is online
 *
 * @example
 * const isOnline = useOnlineStatus();
 * if (!isOnline) {
 *   return <OfflineIndicator />;
 * }
 */
export function useOnlineStatus(): boolean {
  // Subscribe to online/offline events
  const subscribe = (callback: () => void) => {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    return () => {
      window.removeEventListener("online", callback);
      window.removeEventListener("offline", callback);
    };
  };

  const getSnapshot = () => navigator.onLine;

  // For SSR, assume online
  const getServerSnapshot = () => true;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Alternative hook using useState for legacy browser support
 * @deprecated Use useOnlineStatus() instead
 */
export function useOnlineStatusLegacy(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
