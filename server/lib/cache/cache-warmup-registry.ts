/**
 * CENTRALIZED CACHE WARMUP REGISTRY - PHASE 4
 * Maps cache keys to storage loaders to ensure cache warming and endpoints use identical keys/methods
 * This prevents cache mismatches where warming uses different keys than actual endpoint requests
 *
 * Separated from cache-strategies.ts to avoid circular dependency with UnifiedCache
 *
 * PHASE 5: Added primedByLoader flag to prevent double caching during warmup
 */

import type { IStorage } from "../../repositories/storage-interfaces.js";
import { CacheKeys } from "./cache-keys.js";

export type CacheWarmupTask<T = unknown> = {
  key: string;
  loader: (storage: IStorage) => Promise<T>;
  ttl: number;
  category?: "media" | "data" | "static";
  /**
   * If true, the loader function already primed the cache
   * and warmTask should skip its own set() call
   * @default false
   */
  primedByLoader?: boolean | undefined;
};

export const CacheWarmupRegistry = {
  // Homepage routes
  homepageBatch: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.homepage.batch(),
    loader: async () => {
      // PHASE 4 FIX: Match actual endpoint implementation - fetch all 7 datasets in parallel
      const timestamp = new Date().toISOString();
      const [
        hero,
        slogans,
        sections,
        sustainability,
        featuredProductsSettings,
        products,
        categories,
      ] = await Promise.all([
        storage.getHomepageHero(),
        storage.getHomepageSlogans(),
        storage.getHomepageSections(),
        storage.getHomepageHero(),
        storage.getHomepageFeaturedProductsSettings(),
        storage.getProducts(20),
        storage.getCategories(),
      ]);

      return {
        hero: { result: hero, timestamp },
        slogans: { result: slogans, timestamp },
        sections: { result: sections, timestamp },
        sustainability: { result: sustainability, timestamp },
        featuredProductsSettings: {
          result: featuredProductsSettings,
          timestamp,
        },
        products: { result: products, timestamp },
        categories: { result: categories, timestamp },
      };
    },
    ttl: 10 * 60 * 1000,
    category: "data",
  }),

  homepageHero: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.homepage.hero(),
    loader: () => storage.getHomepageHero(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  homepageSlogans: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.homepage.slogans(),
    loader: () => storage.getHomepageSlogans(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  homepageProcessCards: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.homepage.processCards(),
    loader: () => storage.getHomepageProcessCards(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  homepageSections: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.homepage.sections(),
    loader: () => storage.getHomepageSections(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  homepageSustainability: (_storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.homepage.sustainability(),
    loader: () => Promise.resolve(null), // Method removed from storage
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  homepageFeaturedProductsSettings: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.homepage.featuredProducts(),
    loader: () => storage.getHomepageFeaturedProductsSettings(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  // Products - CRITICAL: Use getProductsSummary with matching pagination (100, 0)
  // PHASE 5: Using 'rebuild' strategy to force fresh DB fetch during warmup
  productsSummary: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.products.summary(100, 0),
    loader: async () => {
      // Force DB fetch and cache write during warmup
      return await storage.getProductsSummary(100, 0, {
        cacheStrategy: "rebuild",
      });
    },
    ttl: 10 * 60 * 1000,
    category: "data",
    primedByLoader: true, // Loader already writes to cache, skip warmTask set()
  }),

  // PHASE 2A TASK 4: Product count warmup to eliminate 239ms L2 KV latency
  // Pre-warms L1 cache for countLookup in getProductsSummary
  productCount: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.products.totalCount(),
    loader: async () => {
      return await storage.getProductsCount();
    },
    ttl: 60 * 60 * 1000, // 1 hour - matches getProductCount() TTL
    category: "data",
    primedByLoader: true, // Loader already writes to cache, skip warmTask set()
  }),

  // Navigation
  navigationItems: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.navigation.items(),
    loader: () => storage.getNavigationItems(),
    ttl: 30 * 60 * 1000,
    category: "static",
  }),

  navigationGlassmorphism: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.navigation.settings(),
    loader: () => storage.getNavigationGlassmorphismSettings(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  // Categories & Featured Products
  categories: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.products.categories(),
    loader: () => storage.getCategories(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  // Media assets - metadata only
  mediaAssets: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.media.paginated(20, 0),
    loader: () => storage.getMediaAssetsWithCount(20, 0),
    ttl: 6 * 60 * 60 * 1000, // 6 hours - media rarely changes
    category: "media",
  }),

  // PHASE 1 OPTIMIZATION: Aggressively pre-warm media batch content with signed URLs
  // This eliminates the 8-10 second waterfall of sequential media requests on page load
  mediaBatchContent: (storage: IStorage): CacheWarmupTask => ({
    key: "media-batch-content-warmup",
    loader: async () => {
      // Pre-generate signed URLs for batch content (this warms the batch endpoint cache)
      const mediaResult = await storage.getMediaAssetsWithCount(20, 0);
      const mediaArray = mediaResult.assets || [];
      const mediaIds = mediaArray.map((m) => m.id).filter((id) => id != null);

      if (mediaIds.length === 0) {
        return { warmed: 0, total: 0 };
      }

      // Pre-generate signed URLs for batch content (this warms the batch endpoint cache)
      // The batch endpoint will cache the response with signed URLs for 4 minutes
      try {
        const { appStorageService } = await import("../storage/app-service.js");

        let warmedCount = 0;
        // Generate signed URLs for each asset (this populates the batch content cache)
        for (const mediaAsset of mediaArray.slice(0, 15)) {
          try {
            if (mediaAsset.storagePath) {
              let pathToServe = mediaAsset.storagePath;
              if (mediaAsset.type === "image" && mediaAsset.imageVariants?.original) {
                pathToServe = mediaAsset.imageVariants.original;
              }
              await appStorageService.generateSignedUrl(pathToServe, 300);
              warmedCount++;
            }
          } catch (_error) {}
        }

        return { warmed: warmedCount, total: mediaIds.length };
      } catch (_error) {
        return { warmed: 0, total: mediaIds.length };
      }
    },
    ttl: 6 * 60 * 60 * 1000, // 6 hours - matches media TTL
    category: "media",
    primedByLoader: false, // We want to cache the warmup result
  }),

  // About page
  aboutHero: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.about.hero(),
    loader: () => storage.getAboutHero(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  // Sustainability page
  sustainabilityHero: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.sustainability.hero(),
    loader: () => storage.getSustainabilityHero(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  sustainabilityMetrics: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.sustainability.metrics(),
    loader: () => storage.getSustainabilityMetrics(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  sustainabilityUnified: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.sustainability.unified(),
    loader: () => storage.getUnifiedSustainability(),
    ttl: 60 * 60 * 1000, // 1 hour - matches endpoint TTL
    category: "data",
  }),

  // Manufacturing page
  manufacturingHero: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.manufacturing.hero(),
    loader: () => storage.getManufacturingHero(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  manufacturingProcesses: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.manufacturing.processes(),
    loader: () => storage.getManufacturingProcesses(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  // Technology page
  technologyHero: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.technology.hero(),
    loader: () => storage.getTechnologyHero(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  technologyInnovations: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.technology.innovations(),
    loader: () => storage.getTechnologyInnovations(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  // Contact page
  contactConfiguration: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.contact.configuration(),
    loader: () => storage.getContactPageConfiguration(),
    ttl: 30 * 60 * 1000,
    category: "data",
  }),

  // Footer configuration
  footerConfig: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.footer.config(),
    loader: () => storage.getFooterConfiguration(),
    ttl: 60 * 60 * 1000, // 1 hour cache
    category: "data",
  }),

  // PHASE 4: Taxonomy endpoints - eliminate 1-2s cold start delays
  certificates: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.certificates.list(),
    loader: () => storage.getCertificates(),
    ttl: 60 * 60 * 1000, // 1 hour - rarely changes
    category: "data",
  }),

  sizeCharts: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.sizeCharts.list(),
    loader: () => storage.getSizeCharts(),
    ttl: 60 * 60 * 1000, // 1 hour - rarely changes
    category: "data",
  }),

  accessories: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.accessories.list(),
    loader: () => storage.getAccessories(),
    ttl: 60 * 60 * 1000, // 1 hour - rarely changes
    category: "data",
  }),

  fabrics: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.fabrics.list(),
    loader: () => storage.getFabrics(),
    ttl: 60 * 60 * 1000, // 1 hour - rarely changes
    category: "data",
  }),

  fibers: (storage: IStorage): CacheWarmupTask => ({
    key: CacheKeys.fibers.list(),
    loader: () => storage.getFibers(),
    ttl: 60 * 60 * 1000, // 1 hour - rarely changes
    category: "data",
  }),

  // PERFORMANCE OPTIMIZATION: Pre-warm featured/popular products to eliminate 3.5s cold starts
  // This warms the full product context (media, related products, specs) for frequently accessed products
  featuredProducts: (storage: IStorage): CacheWarmupTask => ({
    key: "featured-products-warmup",
    loader: async () => {
      // Get featured product settings to identify which products to warm
      const featuredSettings = await storage.getHomepageFeaturedProductsSettings();
      const _featuredProductIds = featuredSettings?.featuredProductIds || [];

      // Also get first page of active products to warm popular ones
      const productsResult = await storage.getProductsSummary(10, 0); // Top 10 products
      const productsArray = productsResult.products || [];
      const popularProductIds = productsArray.map((p) => p.id).filter((id) => id != null);

      // Combine and deduplicate
      const allIds = [
        ...(Array.isArray(["featuredProductIds"]) ? ["featuredProductIds"] : []),
        ...(Array.isArray(popularProductIds) ? popularProductIds : []),
      ];
      const productIdsToWarm = Array.from(new Set(allIds.filter((id) => id != null))) as number[];

      let warmedCount = 0;

      // Warm each product by URL path (matches actual user requests)
      for (const productId of productIdsToWarm.slice(0, 15)) {
        // Limit to top 15
        try {
          // Fetch product to get its URL path
          const product = await storage.getProduct(productId);
          if (product?.urlPath) {
            // Warm using the same method as the actual endpoint
            const productContext = await storage.getProductByPath(product.urlPath);
            if (productContext) {
              warmedCount++;
            }
          }
        } catch (_error) {}
      }

      return { warmedCount, total: productIdsToWarm.length };
    },
    ttl: 60 * 60 * 1000, // 60 minutes - matches product detail cache
    category: "data",
    primedByLoader: true, // Products are already cached by getProductByPath
  }),
};
