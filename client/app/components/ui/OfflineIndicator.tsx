/**
 * Offline Indicator Component
 * Shows a non-intrusive banner when the user loses network connectivity
 */

import { WifiOff } from "lucide-react";
import { useOfflineStatus } from "@/hooks/use-offline-status";

export function OfflineIndicator() {
  const isOffline = useOfflineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 z-toast -translate-x-1/2 transform"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span>You're offline. Some features may be unavailable.</span>
      </div>
    </div>
  );
}
