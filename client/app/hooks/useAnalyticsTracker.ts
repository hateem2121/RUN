interface TrackingEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface SearchTerm {
  term: string;
  count: number;
}

interface FilterUsage {
  filter: string;
  count: number;
}

interface ViewModeUsage {
  mode: string;
  count: number;
  percentage: number;
}

interface ConversionFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export function useAnalyticsTracker() {
  // Track page view
  const trackPageView = (page: string) => {
    const analytics = JSON.parse(localStorage.getItem("productAnalytics") || "{}");
    analytics.pageViews = (analytics.pageViews || 0) + 1;
    analytics.lastPageView = {
      page,
      timestamp: Date.now(),
    };
    localStorage.setItem("productAnalytics", JSON.stringify(analytics));
  };

  // Track product view
  const trackProductView = (productName: string) => {
    const analytics = JSON.parse(localStorage.getItem("productAnalytics") || "{}");
    if (!analytics.productViews) {
      analytics.productViews = {};
    }
    analytics.productViews[productName] = (analytics.productViews[productName] || 0) + 1;
    localStorage.setItem("productAnalytics", JSON.stringify(analytics));
  };

  // Track search
  const trackSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return;
    }

    const analytics = JSON.parse(localStorage.getItem("productAnalytics") || "{}");
    if (!analytics.searchTerms) {
      analytics.searchTerms = [];
    }

    const existing = analytics.searchTerms.find((item: SearchTerm) => item.term === searchTerm);
    if (existing) {
      existing.count++;
    } else {
      analytics.searchTerms.push({ term: searchTerm, count: 1 });
    }

    // Keep only top 10 search terms
    analytics.searchTerms.sort((a: SearchTerm, b: SearchTerm) => b.count - a.count);
    analytics.searchTerms = analytics.searchTerms.slice(0, 10);

    localStorage.setItem("productAnalytics", JSON.stringify(analytics));
  };

  // Track filter usage
  const trackFilterUsage = (filterType: string) => {
    const analytics = JSON.parse(localStorage.getItem("productAnalytics") || "{}");
    if (!analytics.filterUsage) {
      analytics.filterUsage = [];
    }

    const existing = analytics.filterUsage.find((item: FilterUsage) => item.filter === filterType);
    if (existing) {
      existing.count++;
    } else {
      analytics.filterUsage.push({ filter: filterType, count: 1 });
    }

    localStorage.setItem("productAnalytics", JSON.stringify(analytics));
  };

  // Track view mode
  const trackViewMode = (mode: string) => {
    const analytics = JSON.parse(localStorage.getItem("productAnalytics") || "{}");
    if (!analytics.viewModeUsage) {
      analytics.viewModeUsage = [];
    }

    // Update view mode usage
    const total =
      analytics.viewModeUsage.reduce((sum: number, item: ViewModeUsage) => sum + item.count, 0) + 1;

    const existing = analytics.viewModeUsage.find((item: ViewModeUsage) => item.mode === mode);
    if (existing) {
      existing.count++;
    } else {
      analytics.viewModeUsage.push({ mode, count: 1, percentage: 0 });
    }

    // Calculate percentages
    analytics.viewModeUsage.forEach((item: ViewModeUsage) => {
      item.percentage = Math.round((item.count / total) * 100);
    });

    localStorage.setItem("productAnalytics", JSON.stringify(analytics));
  };

  // Track conversion funnel stage
  const trackFunnelStage = (stage: string) => {
    const analytics = JSON.parse(localStorage.getItem("productAnalytics") || "{}");
    if (!analytics.conversionFunnel) {
      analytics.conversionFunnel = [
        { stage: "Product List View", count: 0, percentage: 100 },
        { stage: "Product Detail View", count: 0, percentage: 0 },
        { stage: "Inquiry Initiated", count: 0, percentage: 0 },
        { stage: "Contact Form Submitted", count: 0, percentage: 0 },
      ];
    }

    const stageIndex = analytics.conversionFunnel.findIndex(
      (item: ConversionFunnelStage) => item.stage === stage,
    );
    if (stageIndex !== -1) {
      analytics.conversionFunnel[stageIndex].count++;

      // Update percentages
      const baseCount = analytics.conversionFunnel[0].count;
      analytics.conversionFunnel.forEach((item: ConversionFunnelStage) => {
        item.percentage = baseCount > 0 ? Math.round((item.count / baseCount) * 100) : 0;
      });
    }

    localStorage.setItem("productAnalytics", JSON.stringify(analytics));
  };

  // Generic event tracking
  const trackEvent = (_event: TrackingEvent) => {
    // In production, this would send to analytics service
  };

  return {
    trackPageView,
    trackProductView,
    trackSearch,
    trackFilterUsage,
    trackViewMode,
    trackFunnelStage,
    trackEvent,
  };
}
