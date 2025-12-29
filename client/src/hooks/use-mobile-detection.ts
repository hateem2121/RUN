import { useLayoutEffect, useState } from "react";
import { breakpoints } from "@/lib/design-tokens";

const getInitialMobileState = () => {
  if (typeof window === "undefined") return { isMobile: false, isTablet: false };

  const userAgent = navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  const width = window.innerWidth;

  const isMobileDevice = mobileRegex.test(userAgent) || width < breakpoints.md;
  const isTabletDevice =
    tabletRegex.test(userAgent) || (width >= breakpoints.md && width < breakpoints.lg);

  return {
    isMobile: isMobileDevice && !isTabletDevice,
    isTablet: isTabletDevice,
  };
};

export const useMobileDetection = () => {
  const initial = getInitialMobileState();
  const [isMobile, setIsMobile] = useState(initial.isMobile);
  const [isTablet, setIsTablet] = useState(initial.isTablet);

  useLayoutEffect(() => {
    const mobileQuery = window.matchMedia(`(max-width: ${breakpoints.md - 1}px)`);
    const tabletQuery = window.matchMedia(
      `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
    );

    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;

      const isMobileViewport = mobileQuery.matches;
      const isTabletViewport = tabletQuery.matches;
      const isMobileUA = mobileRegex.test(userAgent);
      const isTabletUA = tabletRegex.test(userAgent);

      const isMobileDevice = isMobileUA || isMobileViewport;
      const isTabletDevice = (isTabletUA || isTabletViewport) && !isMobileViewport;

      setIsMobile(isMobileDevice && !isTabletDevice);
      setIsTablet(isTabletDevice);
    };

    checkDevice();

    const handleMobileChange = () => checkDevice();
    const handleTabletChange = () => checkDevice();

    mobileQuery.addEventListener("change", handleMobileChange);
    tabletQuery.addEventListener("change", handleTabletChange);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      mobileQuery.removeEventListener("change", handleMobileChange);
      tabletQuery.removeEventListener("change", handleTabletChange);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
};
