/**
 * Offline detection hook
 *
 * Monitors network status and shows toast notifications
 * when the user goes online/offline.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Hook to monitor network status
 *
 * @returns Current online status
 *
 * @example
 * function App() {
 *   const isOnline = useNetworkStatus();
 *
 *   return (
 *     <div>
 *       {!isOnline && <Banner>You are offline</Banner>}
 *     </div>
 *   );
 * }
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online", {
        description: "Your changes will now be saved.",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline", {
        description: "Changes won't be saved until you reconnect.",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to check if we should block an action due to being offline
 *
 * @returns Object with isOnline status and showOfflineWarning function
 *
 * @example
 * const { isOnline, showOfflineWarning } = useOfflineGuard();
 *
 * const handleSubmit = () => {
 *   if (!isOnline) {
 *     showOfflineWarning();
 *     return;
 *   }
 *   // proceed with submission
 * };
 */
export function useOfflineGuard() {
  const isOnline = useNetworkStatus();

  const showOfflineWarning = () => {
    toast.warning("You're offline", {
      description: "This action requires an internet connection.",
      duration: 4000,
    });
  };

  return {
    isOnline,
    showOfflineWarning,
  };
}
