/**
 * PHASE 2 OPTIMIZATION: Homepage Batch Loader
 * Replaces 7 separate API calls with 1 unified batch request
 */

import type {
  Category,
  HomepageFeaturedProductsSettings,
  HomepageHero,
  HomepageProcessCard,
  HomepageSection,
  HomepageSlogan,
  Product,
  UnifiedSustainability,
} from "@/../../shared/schema";

export interface HomepageBatchData {
  hero: HomepageHero | null;
  slogans: HomepageSlogan[];
  processCards: HomepageProcessCard[];
  sections: HomepageSection[];
  sustainability: UnifiedSustainability | null;
  featuredProductsSettings: HomepageFeaturedProductsSettings | null;
  products: Product[];
  categories: Category[];
  _meta: {
    fetchedAt: string;
    totalRequests: number;
    cacheEnabled: boolean;
    cacheTTL: number;
  };
}

export class HomepageBatchLoader {
  private static performanceMetrics: {
    batchTime: number;
    separateTime: number;
    requestsSaved: number;
    cacheHits: number;
    cacheMisses: number;
  } = {
    batchTime: 0,
    separateTime: 0,
    requestsSaved: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  /**
   * Load all homepage data using the unified batch endpoint
   */
  static async loadBatchData(): Promise<HomepageBatchData> {
    const startTime = performance.now();

    try {
      const response = await fetch("/api/homepage-batch");

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Track performance metrics
      HomepageBatchLoader.performanceMetrics.batchTime = totalTime;
      HomepageBatchLoader.performanceMetrics.requestsSaved = 6; // 7 requests reduced to 1

      // Check cache status from headers
      const cacheStatus = response.headers.get("X-Cache");
      if (cacheStatus === "HIT") {
        HomepageBatchLoader.performanceMetrics.cacheHits++;
      } else {
        HomepageBatchLoader.performanceMetrics.cacheMisses++;
      }

      // const responseTime = response.headers.get('X-Response-Time');
      // const dataSources = response.headers.get('X-Data-Sources');

      return data;
    } catch (error) {
      const endTime = performance.now();
      HomepageBatchLoader.performanceMetrics.batchTime = endTime - startTime;
      // Removed debug console statement for production
      throw error;
    }
  }

  /**
   * Load homepage data using separate requests (for comparison)
   */
  static async loadSeparateData(): Promise<HomepageBatchData> {
    const startTime = performance.now();

    try {
      const [
        heroRes,
        slogansRes,
        processCardsRes,
        sectionsRes,
        sustainabilityRes,
        featuredProductsSettingsRes,
        productsRes,
        categoriesRes,
      ] = await Promise.all([
        fetch("/api/homepage-hero"),
        fetch("/api/homepage-slogans"),
        fetch("/api/homepage-process-cards"),
        fetch("/api/homepage-sections"),
        fetch("/api/homepage-sustainability"),
        fetch("/api/homepage-featured-products-settings"),
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);

      const [
        hero,
        slogans,
        processCards,
        sections,
        sustainability,
        featuredProductsSettings,
        products,
        categories,
      ] = await Promise.all([
        heroRes.json(),
        slogansRes.json(),
        processCardsRes.json(),
        sectionsRes.json(),
        sustainabilityRes.json(),
        featuredProductsSettingsRes.json(),
        productsRes.json(),
        categoriesRes.json(),
      ]);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      HomepageBatchLoader.performanceMetrics.separateTime = totalTime;

      // Removed debug console statement for production

      return {
        hero: hero || {},
        slogans: slogans || [],
        processCards: processCards || [],
        sections: sections || [],
        sustainability: sustainability || {},
        featuredProductsSettings: featuredProductsSettings || {},
        products: products || [],
        categories: categories || [],
        _meta: {
          fetchedAt: new Date().toISOString(),
          totalRequests: 7,
          cacheEnabled: false,
          cacheTTL: 0,
        },
      };
    } catch (error) {
      const endTime = performance.now();
      HomepageBatchLoader.performanceMetrics.separateTime = endTime - startTime;
      // Removed debug console statement for production
      throw error;
    }
  }

  /**
   * Get performance comparison metrics
   */
  static getPerformanceMetrics() {
    const improvement =
      HomepageBatchLoader.performanceMetrics.separateTime > 0
        ? ((HomepageBatchLoader.performanceMetrics.separateTime - HomepageBatchLoader.performanceMetrics.batchTime) /
            HomepageBatchLoader.performanceMetrics.separateTime) *
          100
        : 0;

    return {
      ...HomepageBatchLoader.performanceMetrics,
      improvement: improvement.toFixed(2),
      networkRequests: {
        before: 7,
        after: 1,
        reduction: "85.7%",
      },
    };
  }

  /**
   * Run performance comparison test
   */
  static async runPerformanceComparison(): Promise<void> {
    // Removed debug console statement for production

    try {
      // Test separate requests first
      await HomepageBatchLoader.loadSeparateData();

      // Wait a moment to avoid cache conflicts
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Test batch request
      await HomepageBatchLoader.loadBatchData();

      // const metrics = this.getPerformanceMetrics();

      // Removed debug console statement for production
      // Removed debug console statement for production
      // Removed debug console statement for production
      // Removed debug console statement for production
      // Removed debug console statement for production
      // Removed debug console statement for production
      // Removed debug console statement for production
      // Removed debug console statement for production
    } catch (error) {
      // Removed debug console statement for production
    }
  }
}
