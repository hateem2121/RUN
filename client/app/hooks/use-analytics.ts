/**
 * PHASE 2: ANALYTICS HOOK
 * React hook for automatic page view tracking and route changes
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { analytics } from "../lib/google-analytics";

interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackPerformance?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: Analytics dimensions can have any value
  customDimensions?: Record<string, unknown>;
}

/**
 * Hook to automatically track page views and route changes
 */
export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { pathname: location } = useLocation();
  const prevLocationRef = useRef<string>(location);
  const pageStartTime = useRef<number>(Date.now());

  const { trackPageViews = true, trackPerformance = true, customDimensions = {} } = options;

  useEffect(() => {
    if (location !== prevLocationRef.current) {
      const now = Date.now();
      const timeOnPreviousPage = now - pageStartTime.current;

      // Track time spent on previous page
      if (prevLocationRef.current && timeOnPreviousPage > 1000) {
        // Only if spent more than 1 second
        analytics.trackEvent({
          action: "page_timing",
          category: "Performance",
          label: prevLocationRef.current,
          value: timeOnPreviousPage,
          custom_parameters: {
            time_on_page: timeOnPreviousPage,
            previous_page: prevLocationRef.current,
          },
        });
      }

      // Track new page view
      if (trackPageViews) {
        analytics.trackPageView(location, document.title, customDimensions);
      }

      // Track performance metrics for category pages
      if (trackPerformance && location.includes("/categories/")) {
        setTimeout(() => {
          const loadTime = Date.now() - now;
          const categoryName = location.split("/categories/")[1]?.replace("/", "");

          if (categoryName) {
            analytics.trackCategoryPageView(categoryName, 0, loadTime); // Product count will be updated separately
          }
        }, 1000);
      }

      prevLocationRef.current = location;
      pageStartTime.current = now;
    }
  }, [location, trackPageViews, trackPerformance, customDimensions]);

  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackProductInteraction: analytics.trackProductInteraction.bind(analytics),
    trackMediaPerformance: analytics.trackMediaPerformance.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackContactForm: analytics.trackContactFormSubmission.bind(analytics),
    isEnabled: analytics.isAnalyticsEnabled(),
  };
}

/**
 * Hook for tracking media loading performance
 */
export function useMediaAnalytics() {
  const trackMediaLoad = (
    assetId: number,
    startTime: number,
    cacheStatus?: string,
    fileSize?: number,
  ) => {
    const loadTime = Date.now() - startTime;
    analytics.trackMediaPerformance(assetId, loadTime, cacheStatus || "unknown", fileSize || 0);
  };

  return { trackMediaLoad };
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionAnalytics() {
  const trackClick = (element: string, location?: string) => {
    analytics.trackEvent({
      action: "click",
      category: "User Interaction",
      label: element,
      custom_parameters: {
        element_type: element,
        page_location: location || window.location.pathname,
      },
    });
  };

  const trackScroll = (depth: number) => {
    analytics.trackEvent({
      action: "scroll",
      category: "User Interaction",
      label: `${depth}%`,
      value: depth,
      custom_parameters: {
        scroll_depth: depth,
        page_location: window.location.pathname,
      },
    });
  };

  return { trackClick, trackScroll };
}

export default useAnalytics;
