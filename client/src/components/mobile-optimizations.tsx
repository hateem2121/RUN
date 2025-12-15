import { useEffect } from "react";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

export function MobileOptimizations() {
  const { isMobile, isTablet } = useMobileDetection();

  useEffect(() => {
    // DISABLED: Mobile optimizations causing Visual Editor coordinate system mismatch
    // The Visual Editor requires stable documentElement state for proper coordinate tracking
    console.log(
      "[MobileOptimizations] Disabled to fix Visual Editor coordinate system",
    );
    return;
  }, [isMobile, isTablet]);

  return null;
}
