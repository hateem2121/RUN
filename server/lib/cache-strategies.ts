/**
 * CACHE STRATEGIES - PHASE 2A
 * Standardized caching strategies for different data types
 * 
 * Provides consistent TTL, invalidation, and priority settings
 * for unified cache management across the application
 * 
 * PHASE 5: Added CacheFetchStrategy for warmup optimization
 */

import { UnifiedCache } from './unified-cache.js';
import { logger } from './smart-logger.js';
import type { IStorage } from '../storage.js';
import { CacheKeys, InvalidationPatterns } from './cache-keys.js';

// PHASE 4: Lazy initialization to avoid circular dependency
// Use getter function instead of module-level constant
const getCache = () => UnifiedCache.getInstance();

/**
 * PHASE 5: Cache Fetch Strategy
 * Controls how repository methods interact with cache
 * 
 * - 'normal': Standard cache-read → DB → cache-write flow for runtime requests
 * - 'bypass': Skip all caching, always query DB (for debugging/testing)
 * - 'rebuild': Skip cache read, query DB, write to cache (for warmup)
 */
export type CacheFetchStrategy = 'normal' | 'bypass' | 'rebuild';

/**
 * Options for cache-aware repository methods
 */
export interface RepositoryCacheOptions {
  /**
   * Strategy for cache interaction
   * @default 'normal'
   */
  cacheStrategy?: CacheFetchStrategy;
}

// Cache options type for strategies
type CacheOptions = {
  ttl?: number;
  category?: 'media' | 'data' | 'static';
  priority?: 'critical' | 'high' | 'normal' | 'low';
  tags?: string[];
};

// PHASE 2: CACHE TUNING - Aligned with UnifiedCache TTL_PRESETS for consistency
// Target: Push cache hit rate from 60.3% → 70%+
// const cache = getCache();
const TTL = UnifiedCache.TTL_PRESETS;

// Cache strategy factory functions to avoid readonly type issues
export const CacheStrategies = {
  // Critical data that changes rarely (navigation, footer, hero images)
  // PHASE 2: Using 12-hour TTL for maximum cache hit rate on static content
  STATIC: (): CacheOptions => ({
    ttl: TTL.STATIC, // 12 hours - long TTL for rarely changing data
    category: 'static',
    priority: 'high',
    tags: ['static']
  }),

  // User-facing content (homepage, categories, size charts)
  // PHASE 2: Increased from 30min → 60min for better cache hit rate
  CONTENT: (): CacheOptions => ({
    ttl: 60 * 60 * 1000, // 60 minutes - occasionally updating content
    category: 'data',
    priority: 'critical',
    tags: ['content']
  }),

  // Media assets and files
  // PHASE 2: Keep 1 hour for media (good balance between freshness and cache hits)
  MEDIA: (): CacheOptions => ({
    ttl: 60 * 60 * 1000, // 1 hour (keep existing)
    category: 'media',
    priority: 'high',
    tags: ['media']
  }),

  // Computed/processed data (expensive operations like product aggregations)
  // PHASE 2: Keep 60min for expensive computed operations
  COMPUTED: (): CacheOptions => ({
    ttl: 60 * 60 * 1000, // 60 minutes (keep existing)
    category: 'data',
    priority: 'normal',
    tags: ['computed']
  }),

  // User-specific data (user sessions, personalized content)
  // PHASE 2: Increased from 5min → 10min for better cache hit rate on user data
  USER_DATA: (): CacheOptions => ({
    ttl: 10 * 60 * 1000, // 10 minutes - near real-time user data
    category: 'data',
    priority: 'normal',
    tags: ['user']
  }),

  // Temporary/short-lived data (flash messages, temporary tokens)
  TEMPORARY: (): CacheOptions => ({
    ttl: 60 * 1000, // 1 minute (keep existing)
    category: 'data',
    priority: 'low',
    tags: ['temporary']
  })
};

// PHASE 4: CacheKeys and InvalidationPatterns now imported from cache-keys.ts
// This breaks the circular dependency chain:
// - cache-keys.ts has NO dependencies
// - cache-strategies.ts imports CacheKeys from cache-keys.ts
// - cache-warmup-registry.ts imports CacheKeys from cache-keys.ts (not from cache-strategies!)
// - No more circular dependency!
export { CacheKeys, InvalidationPatterns } from './cache-keys.js';

// High-level cache operations with built-in strategies
export class CacheOperations {

  // Homepage data caching
  static async getHomepageData(key: keyof typeof CacheKeys.homepage, loader: () => Promise<any>) {
    const cacheKey = CacheKeys.homepage[key]();

    let data = await getCache().get(cacheKey);
    if (data === null) {
      logger.debug(`[Cache] Loading ${key} data from source`);
      data = await loader();
      const options = CacheStrategies.CONTENT();
      await getCache().set(cacheKey, data, options.ttl, options.category);
    }

    return data;
  }

  // Media caching with variants
  static async getMediaAsset(id: number, loader: () => Promise<any>) {
    const cacheKey = CacheKeys.media.asset(id);

    let data = await getCache().get(cacheKey);
    if (data === null) {
      logger.debug(`[Cache] Loading media asset ${id} from source`);
      data = await loader();
      const options = CacheStrategies.MEDIA();
      await getCache().set(cacheKey, data, options.ttl, options.category);
    }

    return data;
  }

  // Batch media caching
  static async getMediaBatch(ids: number[], loader: () => Promise<any>) {
    const cacheKey = CacheKeys.media.batch(ids);

    let data = await getCache().get(cacheKey);
    if (data === null) {
      logger.debug(`[Cache] Loading media batch [${ids.join(',')}] from source`);
      data = await loader();
      const options = CacheStrategies.MEDIA();
      await getCache().set(cacheKey, data, options.ttl, options.category);
    }

    return data;
  }

  // Product caching
  static async getProductData(type: keyof typeof CacheKeys.products, idOrFilters?: number | string, loader?: () => Promise<any>) {
    let cacheKey: string;

    if (type === 'list' && typeof idOrFilters === 'string') {
      cacheKey = CacheKeys.products.list(idOrFilters);
    } else if (type === 'item' && typeof idOrFilters === 'number') {
      cacheKey = CacheKeys.products.item(idOrFilters);
    } else if (type === 'related' && typeof idOrFilters === 'number') {
      cacheKey = CacheKeys.products.related(idOrFilters);
    } else {
      cacheKey = CacheKeys.products.categories();
    }

    let data = await getCache().get(cacheKey);
    if (data === null && loader) {
      logger.debug(`[Cache] Loading product data for ${type} from source`);
      data = await loader();
      const options = CacheStrategies.CONTENT();
      await getCache().set(cacheKey, data, options.ttl, options.category);
    }

    return data;
  }

  // Computed data caching (for expensive operations)
  static async getComputedData(operation: string, hash: string, loader: () => Promise<any>) {
    const cacheKey = CacheKeys.computed.query(hash);

    let data = await getCache().get(cacheKey);
    if (data === null) {
      logger.debug(`[Cache] Computing ${operation} with hash ${hash}`);
      const startTime = performance.now();
      data = await loader();
      const duration = performance.now() - startTime;

      // Cache longer for expensive operations
      const strategy = duration > 1000 ?
        { ...CacheStrategies.COMPUTED(), ttl: 60 * 60 * 1000 } : // 1 hour for slow operations
        CacheStrategies.COMPUTED();

      await getCache().set(cacheKey, data, strategy.ttl, strategy.category);
      logger.debug(`[Cache] Computed ${operation} in ${duration.toFixed(1)}ms, cached for ${(strategy.ttl || 0) / 1000}s`);
    }

    return data;
  }

  // Cache invalidation helpers
  static async invalidateHomepage() {
    await getCache().invalidate(InvalidationPatterns.homepage);
    logger.info('[Cache] Invalidated all homepage cache entries');
  }

  static async invalidateMedia(id?: number) {
    if (id) {
      await getCache().delete(CacheKeys.media.asset(id));
      await getCache().invalidate(`^media:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated media cache for asset ${id}`);
    } else {
      await getCache().invalidate(InvalidationPatterns.media);
      logger.info('[Cache] Invalidated all media cache entries');
    }
  }

  static async invalidateProducts(id?: number) {
    if (id) {
      await getCache().delete(CacheKeys.products.item(id));
      await getCache().invalidate(`^products:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated product cache for item ${id}`);
    } else {
      await getCache().invalidate(InvalidationPatterns.products);
      logger.info('[Cache] Invalidated all product cache entries');
    }
  }

  // CHUNK 1: Page-specific cache invalidation methods
  static async invalidateAbout() {
    await getCache().invalidate(InvalidationPatterns.about);
    logger.info('[Cache] Invalidated all about page cache entries');
  }

  static async invalidateSustainability() {
    await getCache().invalidate(InvalidationPatterns.sustainability);
    logger.info('[Cache] Invalidated all sustainability page cache entries');
  }

  static async invalidateManufacturing() {
    await getCache().invalidate(InvalidationPatterns.manufacturing);
    logger.info('[Cache] Invalidated all manufacturing page cache entries');
  }

  static async invalidateTechnology() {
    await getCache().invalidate(InvalidationPatterns.technology);
    logger.info('[Cache] Invalidated all technology page cache entries');
  }

  static async invalidateContact() {
    await getCache().invalidate(InvalidationPatterns.contact);
    logger.info('[Cache] Invalidated all contact page cache entries');
  }

  static async invalidateNavigation() {
    await getCache().invalidate(InvalidationPatterns.navigation);
    logger.info('[Cache] Invalidated all navigation cache entries');
  }

  // CHUNK 1: Shared content cache invalidation methods
  static async invalidateFabrics(id?: number) {
    if (id) {
      await getCache().delete(CacheKeys.fabrics.item(id));
      await getCache().invalidate(`^fabrics:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated fabric cache for item ${id}`);
    } else {
      await getCache().invalidate(InvalidationPatterns.fabrics);
      logger.info('[Cache] Invalidated all fabric cache entries');
    }
  }

  static async invalidateFibers(id?: number) {
    if (id) {
      await getCache().delete(CacheKeys.fibers.item(id));
      await getCache().invalidate(`^fibers:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated fiber cache for item ${id}`);
    } else {
      await getCache().invalidate(InvalidationPatterns.fibers);
      logger.info('[Cache] Invalidated all fiber cache entries');
    }
  }

  static async invalidateCertificates(id?: number) {
    if (id) {
      await getCache().delete(CacheKeys.certificates.item(id));
      await getCache().invalidate(`^certificates:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated certificate cache for item ${id}`);
    } else {
      await getCache().invalidate(InvalidationPatterns.certificates);
      logger.info('[Cache] Invalidated all certificate cache entries');
    }
  }

  static async invalidateSizeCharts(id?: number) {
    if (id) {
      await getCache().delete(CacheKeys.sizeCharts.item(id));
      await getCache().invalidate(`^size_charts:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated size chart cache for item ${id}`);
    } else {
      await getCache().invalidate(InvalidationPatterns.sizeCharts);
      logger.info('[Cache] Invalidated all size chart cache entries');
    }
  }

  static async invalidateAccessories(id?: number) {
    if (id) {
      await getCache().delete(CacheKeys.accessories.item(id));
      await getCache().invalidate(`^accessories:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated accessory cache for item ${id}`);
    } else {
      await getCache().invalidate(InvalidationPatterns.accessories);
      logger.info('[Cache] Invalidated all accessory cache entries');
    }
  }

  // CHUNK 10: Categories cache invalidation
  static async invalidateCategories(id?: number) {
    if (id) {
      await getCache().invalidate(`^products:.*:${id}(?:$|:.*)|^categories:.*:${id}(?:$|:.*)`);
      logger.info(`[Cache] Invalidated category cache for item ${id}`);
    } else {
      await getCache().delete(CacheKeys.products.categories());
      await getCache().invalidate('^products:categories(?:$|:.*)');
      // Also invalidate product lists that may include category data
      await getCache().invalidate('^products:list(?:$|:.*)');
      logger.info('[Cache] Invalidated all categories and related product list cache entries');
    }
  }

  // Cache warming for critical application data
  static async warmCriticalCache(storage: IStorage) {
    logger.info('[Cache] Starting critical cache warming...');

    const warmingTasks = [
      {
        key: CacheKeys.homepage.hero(),
        loader: () => storage.getHomepageHero(),
        options: CacheStrategies.CONTENT()
      },
      {
        key: CacheKeys.homepage.slogans(),
        loader: () => storage.getHomepageSlogans(),
        options: CacheStrategies.CONTENT()
      },
      {
        key: CacheKeys.products.categories(),
        loader: () => storage.getCategories(),
        options: CacheStrategies.CONTENT()
      },
      {
        key: CacheKeys.navigation.items(),
        loader: () => storage.getNavigationItems?.() || Promise.resolve([]),
        options: CacheStrategies.STATIC()
      }
    ];

    await getCache().warm(warmingTasks);
    logger.info('[Cache] Critical cache warming completed');
  }
}
