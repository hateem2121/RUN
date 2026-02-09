/**
 * PHASE 2: GOOGLE ANALYTICS 4 INTEGRATION
 * Free service for comprehensive user behavior tracking and performance insights
 */

// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface GAPageView {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  custom_parameters?: Record<string, any>;
}

export class GoogleAnalytics {
  private static instance: GoogleAnalytics;
  private measurementId: string;
  private isEnabled: boolean = false;
  private isInitialized: boolean = false;

  public static getInstance(): GoogleAnalytics {
    if (!GoogleAnalytics.instance) {
      GoogleAnalytics.instance = new GoogleAnalytics();
    }
    return GoogleAnalytics.instance;
  }

  constructor() {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || "";
    this.isEnabled = !!this.measurementId && import.meta.env.PROD;

    if (this.isEnabled) {
      this.initialize();
    } else if (import.meta.env.DEV) {
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private initialize(): void {
    if (this.isInitialized || typeof window === "undefined") {
      return;
    }

    try {
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];

      // Add gtag function
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      };

      // Add Google Analytics script
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // Initialize GA4
      window.gtag("js", new Date());
      window.gtag("config", this.measurementId, {
        // Enhanced ecommerce for B2B tracking
        enhanced_ecommerce: true,
        // Custom parameters for performance tracking
        custom_map: {
          cache_status: "custom_cache_status",
          load_time: "custom_load_time",
          asset_type: "custom_asset_type",
        },
        // Cookie settings
        cookie_flags: "secure;samesite=strict",
        // Performance optimizations
        transport_type: "beacon",
        anonymize_ip: true,
      });

      this.isInitialized = true;

      // Track initial page load performance
      this.trackPagePerformance();
    } catch (_error) {}
  }

  /**
   * Track page views - optimized for single-page applications
   */
  public trackPageView(
    path?: string,
    title?: string,
    customParams?: GAPageView["custom_parameters"],
  ): void {
    if (!this.isEnabled || !this.isInitialized) {
      return;
    }

    const pageData: GAPageView = {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href,
      ...(customParams ? { custom_parameters: customParams } : {}),
    };

    window.gtag("config", this.measurementId, {
      page_path: pageData.page_path,
      page_title: pageData.page_title,
      page_location: pageData.page_location,
      ...pageData.custom_parameters,
    });

    if (import.meta.env.DEV) {
    }
  }

  /**
   * Track custom events
   */
  public trackEvent(eventData: GAEvent): void {
    if (!this.isEnabled || !this.isInitialized) {
      return;
    }

    window.gtag("event", eventData.action, {
      event_category: eventData.category,
      event_label: eventData.label,
      value: eventData.value,
      ...eventData.custom_parameters,
    });

    if (import.meta.env.DEV) {
    }
  }

  /**
   * Track performance metrics (Core Web Vitals)
   */
  public trackPagePerformance(): void {
    if (!this.isEnabled || typeof window === "undefined") {
      return;
    }

    // Track Core Web Vitals
    const trackWebVital = (name: string, value: number, id: string) => {
      this.trackEvent({
        action: "web_vitals",
        category: "Performance",
        label: name,
        value: Math.round(value),
        custom_parameters: {
          metric_id: id,
          metric_value: value,
          metric_delta: value,
        },
      });
    };

    // LCP - Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const lcpEntry = entry as PerformanceEntry & { id?: string };
        trackWebVital("LCP", entry.startTime, lcpEntry.id || "lcp");
      }
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // FID - First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const fidEntry = entry as PerformanceEntry & {
          processingStart: number;
          id?: string;
        };
        trackWebVital("FID", fidEntry.processingStart - entry.startTime, fidEntry.id || "fid");
      }
    }).observe({ entryTypes: ["first-input"] });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const clsEntry = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value: number;
          id?: string;
        };
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value;
          trackWebVital("CLS", clsValue, clsEntry.id || "cls");
        }
      }
    }).observe({ entryTypes: ["layout-shift"] });
  }

  /**
   * Track category page specific events
   */
  public trackCategoryPageView(categoryName: string, productCount: number, loadTime: number): void {
    this.trackEvent({
      action: "category_page_view",
      category: "Category",
      label: categoryName,
      value: productCount,
      custom_parameters: {
        category_name: categoryName,
        product_count: productCount,
        load_time: loadTime,
        page_type: "category",
      },
    });
  }

  /**
   * Track product interactions
   */
  public trackProductInteraction(
    action: "view" | "click" | "inquiry",
    productName: string,
    categoryName?: string,
  ): void {
    this.trackEvent({
      action: `product_${action}`,
      category: "Product",
      label: productName,
      custom_parameters: {
        product_name: productName,
        category_name: categoryName,
        interaction_type: action,
      },
    });
  }

  /**
   * Track media performance (for our optimized media system)
   */
  public trackMediaPerformance(
    assetId: number,
    loadTime: number,
    cacheStatus: string,
    fileSize: number,
  ): void {
    this.trackEvent({
      action: "media_load",
      category: "Performance",
      label: `Asset ${assetId}`,
      value: Math.round(loadTime),
      custom_parameters: {
        asset_id: assetId,
        load_time: loadTime,
        cache_status: cacheStatus,
        file_size: fileSize,
        load_speed: Math.round((fileSize / loadTime) * 1000), // bytes per second
      },
    });
  }

  /**
   * Track search events
   */
  public trackSearch(searchTerm: string, resultCount: number, category?: string): void {
    this.trackEvent({
      action: "search",
      category: "Search",
      label: searchTerm,
      value: resultCount,
      custom_parameters: {
        search_term: searchTerm,
        result_count: resultCount,
        search_category: category,
      },
    });
  }

  /**
   * Track B2B contact form submissions
   */
  public trackContactFormSubmission(formType: string, productName?: string): void {
    this.trackEvent({
      action: "contact_form_submit",
      category: "Lead Generation",
      label: formType,
      custom_parameters: {
        form_type: formType,
        product_name: productName,
        conversion_type: "b2b_inquiry",
      },
    });
  }

  /**
   * Check if analytics is enabled and working
   */
  public isAnalyticsEnabled(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  /**
   * Get analytics configuration info
   */
  public getConfig() {
    return {
      enabled: this.isEnabled,
      initialized: this.isInitialized,
      measurementId: this.measurementId
        ? `G-${this.measurementId.split("-")[1]}***`
        : "Not configured",
      environment: import.meta.env.MODE,
    };
  }
}

export const analytics = GoogleAnalytics.getInstance();
