/**
 * PRODUCT REPOSITORY
 * Handles product and category operations with caching and performance monitoring
 */

import { db, type DbClient } from "../../db.js";
import {
  products,
  categories,
  mediaAssets,
  sizeCharts,
  certificates,
  fabrics,
  accessories,
} from "../../../shared/schema.js";
import { eq, desc, and, sql, asc, isNull, ne, or, like, inArray } from "drizzle-orm";
import type {
  Product,
  InsertProduct,
  Category,
  InsertCategory,
  ProductSummary,
  ProductDetail,
} from "../../../shared/schema.js";
import { logger } from "../smart-logger.js";
import { queryPerformanceMonitor } from "../query-performance-monitor.js";
import { dbCircuitBreaker } from "../db-circuit-breaker.js";
import { UnifiedCache } from "../unified-cache.js";
import type { RepositoryCacheOptions } from "../cache-strategies.js";
import { CacheKeys } from "../cache-keys.js";
import { MiscRepository } from "./misc-repository.js";

const unifiedCache = UnifiedCache.getInstance();
const miscRepo = new MiscRepository();

// Re-export ProductSummary and ProductDetail for callers
export type { ProductSummary, ProductDetail };

// CHUNK 34: Cache TTL optimized by data volatility - products change moderately
const PRODUCT_CACHE_TTL = 60 * 60 * 1000; // 60 minutes - Extended for better cache hit rates (900s)
const CATEGORY_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours - categories change infrequently (~1x per day max)

// Column selection for product summary (listings, cards)
// Matches ProductSummary type from schema.ts
const PRODUCT_SUMMARY_COLUMNS = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  sku: products.sku,
  description: products.description,
  primaryImageId: products.primaryImageId,
  primaryVideoId: products.primaryVideoId,
  imageIds: products.imageIds,
  videos: products.videos,
  minimumOrderQuantity: products.minimumOrderQuantity,
  leadTime: products.leadTime,
  careInstructions: products.careInstructions,
  technicalSpecs: products.technicalSpecs,
  customFit: products.customFit,
  fiberComposition: products.fiberComposition,
  specifications: products.specifications,
  isActive: products.isActive,
  isFeatured: products.isFeatured,
  categoryId: products.categoryId,
  fabricId: products.fabricId,
  certificateIds: products.certificateIds,
  sizeChartId: products.sizeChartId,
  accessoryIds: products.accessoryIds,
  tags: products.tags,
  urlPath: products.urlPath,
  createdAt: products.createdAt,
} as const;

// Column selection for product details (admin editing - includes all UI fields)
const PRODUCT_DETAIL_COLUMNS = {
  // Basic fields
  id: products.id,
  name: products.name,
  sku: products.sku,
  slug: products.slug,
  description: products.description,
  shortDescription: products.shortDescription,
  isActive: products.isActive,
  isFeatured: products.isFeatured,

  // Category & Fabric
  categoryId: products.categoryId,
  fabricId: products.fabricId,
  sizeChartId: products.sizeChartId,

  // Media
  primaryImageId: products.primaryImageId,
  primaryVideoId: products.primaryVideoId,
  imageIds: products.imageIds,
  videos: products.videos,
  modelFileId: products.modelFileId,

  // Technical Specifications
  specifications: products.specifications,
  technicalSpecs: products.technicalSpecs,
  careInstructions: products.careInstructions,
  tags: products.tags,
  customWeight: products.customWeight,
  customFit: products.customFit,
  minimumOrderQuantity: products.minimumOrderQuantity,
  leadTime: products.leadTime,

  // Certifications & Relationships
  certificateIds: products.certificateIds,
  accessoryIds: products.accessoryIds,
  relatedProductIds: products.relatedProductIds,

  // Customization & SEO
  customizationOptions: products.customizationOptions,
  metaTitle: products.metaTitle,
  metaDescription: products.metaDescription,
  urlPath: products.urlPath,

  // Timestamps
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
} as const;

export class ProductRepository {
  // =============================================================================
  // PRODUCT METHODS
  // =============================================================================

  async getProducts(limit: number = 100, offset: number = 0): Promise<ProductSummary[]> {
    const cacheKey = `products:${limit}:${offset}`;
    const perfTracker = queryPerformanceMonitor.startQuery("getProducts");

    const cached = await unifiedCache.get<ProductSummary[]>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      return cached;
    }

    const result = await dbCircuitBreaker.execute(async () => {
      return await db
        .select(PRODUCT_SUMMARY_COLUMNS)
        .from(products)
        .where(and(eq(products.isActive, true), isNull(products.deletedAt)))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);
    }, "getProducts");

    perfTracker.setCacheHit(false).complete();
    await unifiedCache.set(cacheKey, result, PRODUCT_CACHE_TTL);

    return result;
  }

  // PERFORMANCE: Optimized query for product listings - selects 19 essential columns
  // PHASE 1 TASK 8: Uses cached product count (1-hour TTL) to avoid COUNT(*) OVER() overhead
  // PHASE 2A TASK 2: Instrumented with phase-level timing to identify ~270ms overhead
  // PHASE 5: Added cache strategy support for warmup optimization
  async getProductsSummary(
    limit: number = 100,
    offset: number = 0,
    options?: RepositoryCacheOptions,
  ): Promise<{ products: Partial<Product>[]; totalCount: number }> {
    const cacheKey = `products:summary:${limit}:${offset}`;
    const cacheStrategy = options?.cacheStrategy || "normal";
    const perfTracker = queryPerformanceMonitor.startQuery("getProductsSummary");

    // PHASE 5: Strategy 'rebuild' and 'normal' both check cache
    // Strategy 'bypass' skips cache read entirely
    if (cacheStrategy !== "bypass") {
      // For 'rebuild', we still check cache during warmup to avoid redundant DB queries
      // but the warmup calling code sets this to force a DB fetch
      const shouldCheckCache = cacheStrategy === "normal";

      if (shouldCheckCache) {
        // PHASE 2A: Time cache read operation (L1+L2)
        const cached = await perfTracker.timePhase("cacheRead", async () => {
          return await unifiedCache.get<{
            products: Partial<Product>[];
            totalCount: number;
          }>(cacheKey);
        });
        if (cached) {
          perfTracker.setCacheHit(true).complete();
          return cached;
        }
      }
    }

    // PHASE 1 TASK 8: Use cached product count instead of COUNT(*) OVER() window function
    // PHASE 2A: Time the product count lookup (separate cached query)
    const totalCount = await perfTracker.timePhase("countLookup", async () => {
      return await this.getProductCount();
    });

    // PHASE 2A: Time DB query execution (includes circuit breaker overhead)
    const result = await perfTracker.timePhase("dbQuery", async () => {
      return await dbCircuitBreaker.execute(async () => {
        const queryResult = await db.execute<{
          id: number;
          name: string;
          slug: string;
          sku: string;
          categoryId: number;
          fabricId: number | null;
          primaryImageId: number | null;
          imageIds: number[] | null;
          minimumOrderQuantity: number | null;
          leadTime: string | null;
          careInstructions: string[] | null;
          technicalSpecs: any;
          customFit: string | null;
          fiberComposition: any;
          specifications: string[] | null;
          tags: string[] | null;
          certificateIds: number[] | null;
          isActive: boolean | null;
          isFeatured: boolean | null;
          urlPath: string | null;
        }>(sql`
          SELECT 
            id, name, slug, sku, category_id as "categoryId", fabric_id as "fabricId",
            primary_image_id as "primaryImageId", image_ids as "imageIds",
            minimum_order_quantity as "minimumOrderQuantity", lead_time as "leadTime",
            care_instructions as "careInstructions", technical_specs as "technicalSpecs",
            custom_fit as "customFit", fiber_composition as "fiberComposition",
            specifications, tags, certificate_ids as "certificateIds",
            is_active as "isActive", is_featured as "isFeatured",
            url_path as "urlPath"
          FROM products
          WHERE is_active = true AND deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `);

        const summaryProducts = queryResult.rows as Partial<Product>[];

        return { products: summaryProducts, totalCount };
      }, "getProductsSummary");
    });

    perfTracker.setCacheHit(false);

    // PHASE 5: Strategy 'bypass' skips cache write
    // PHASE 2A: Time cache write operation (includes serialization + L1+L2)
    if (cacheStrategy !== "bypass") {
      await perfTracker.timePhase("cacheWrite", async () => {
        await unifiedCache.set(cacheKey, result, PRODUCT_CACHE_TTL);
      });
    }

    perfTracker.complete();

    return result;
  }

  async getHomepageFeaturedProducts(limit: number = 20): Promise<Partial<Product>[]> {
    const cacheKey = `homepage:featured-products:${limit}`;
    const perfTracker = queryPerformanceMonitor.startQuery("getHomepageFeaturedProducts");

    const cached = await unifiedCache.get<Partial<Product>[]>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      return cached;
    }

    const result = await dbCircuitBreaker.execute(async () => {
      return await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          shortDescription: products.shortDescription,
          primaryImageId: products.primaryImageId,
          categoryId: products.categoryId,
          isFeatured: products.isFeatured,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(and(eq(products.isActive, true), isNull(products.deletedAt)))
        .orderBy(desc(products.isFeatured), desc(products.createdAt))
        .limit(limit);
    }, "getHomepageFeaturedProducts");

    perfTracker.setCacheHit(false).complete();
    await unifiedCache.set(cacheKey, result, PRODUCT_CACHE_TTL);

    return result;
  }

  // PHASE 1 TASK 8: Product count cache with 1-hour TTL
  // Used by getProductsSummary to avoid COUNT(*) OVER() window function overhead
  async getProductCount(): Promise<number> {
    const cacheKey = CacheKeys.products.totalCount();
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(eq(products.isActive, true), isNull(products.deletedAt)));

    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL); // 1 hour TTL
    return count;
  }

  // PHASE 1 TASK 8: Invalidate product count cache
  // Called after product create/update/delete to ensure count stays fresh
  async invalidateProductCount(): Promise<void> {
    const cacheKey = CacheKeys.products.totalCount();
    await unifiedCache.delete(cacheKey);
    logger.info("[ProductRepo] Product count cache invalidated");
  }

  async getProductsByCategoryCount(categoryId: number): Promise<number> {
    const cacheKey = `products:count:category:${categoryId}`;
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      );

    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL);
    return count;
  }

  async getProductsByTagCount(tag: string): Promise<number> {
    const cacheKey = `products:count:tag:${tag}`;
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          sql`${products.tags} @> ${JSON.stringify([tag])}`,
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      );

    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL);
    return count;
  }

  async searchProductsCount(query: string): Promise<number> {
    const cacheKey = `products:count:search:${query}`;
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`),
            like(products.sku, `%${query}%`),
          ),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      );

    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL);
    return count;
  }

  async getProduct(id: number): Promise<ProductDetail | undefined> {
    const [product] = await db
      .select(PRODUCT_DETAIL_COLUMNS)
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)));
    return product;
  }

  async getProductsByCategory(
    categoryId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ProductSummary[]> {
    return await db
      .select(PRODUCT_SUMMARY_COLUMNS)
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProductBySlug(slug: string): Promise<ProductDetail | undefined> {
    const [product] = await db
      .select(PRODUCT_DETAIL_COLUMNS)
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true), isNull(products.deletedAt)));
    return product;
  }

  async getProductByPath(urlPath: string): Promise<any> {
    const cacheKey = `product:by-path:${urlPath}`;
    const perfTracker = queryPerformanceMonitor.startQuery("getProductByPath");

    const cached = await unifiedCache.get<any>(cacheKey);
    if (cached) {
      // Check if this is a cached 404 (negative cache)
      if ((cached as any).__notFound === true) {
        logger.info(`[ProductRepo] ✅ Cache HIT (404) for product path: ${urlPath}`);
        perfTracker.setCacheHit(true).complete();
        return null;
      }
      logger.info(`[ProductRepo] ✅ Cache HIT for product path: ${urlPath}`);
      perfTracker.setCacheHit(true).complete();
      return cached;
    }
    logger.info(`[ProductRepo] ❌ Cache MISS for product path: ${urlPath} - querying database`);

    const result = await dbCircuitBreaker.execute(async () => {
      // CHUNK 2 INSTRUMENTATION: Track query timings for performance analysis
      const queryTimings: Record<string, number> = {};
      const queryStart = performance.now();

      // CHUNK 2: Fetch main product with fabric and sizeChart via LEFT JOINs
      // Optimization: Consolidate 3 queries into 1 (product + fabric + sizeChart)
      const mainQueryStart = performance.now();
      const productResult = await db
        .select({
          ...PRODUCT_DETAIL_COLUMNS,
          fabric: fabrics,
          sizeChart: sizeCharts,
        })
        .from(products)
        .leftJoin(fabrics, and(eq(products.fabricId, fabrics.id), isNull(fabrics.deletedAt)))
        .leftJoin(
          sizeCharts,
          and(eq(products.sizeChartId, sizeCharts.id), isNull(sizeCharts.deletedAt)),
        )
        .where(
          and(
            eq(products.urlPath, urlPath),
            eq(products.isActive, true),
            isNull(products.deletedAt),
          ),
        )
        .limit(1);

      const product = productResult[0];
      const fabric = product?.fabric || null;
      const sizeChart = product?.sizeChart || null;

      queryTimings["1_main_product"] = Math.round(performance.now() - mainQueryStart);

      if (!product) {
        logger.info(`[ProductRepo] [CHUNK 2] Query timings (404): ${JSON.stringify(queryTimings)}`);
        return null;
      }

      // CHUNK 2: Batch fetch remaining relations in parallel (6 queries, down from 8)
      // fabric and sizeChart now fetched via LEFT JOINs in main query
      const batchQueryStart = performance.now();
      const batchTimings: Record<string, number> = {};
      const [
        categoryWithParent,
        mediaResult,
        certificatesResult,
        accessoriesResult,
        fibersData,
        allCategoryProductsResult,
      ] = await Promise.all([
        // CHUNK 2 FIX: Fetch category + parent together (eliminate N+1)
        (async () => {
          const start = performance.now();
          if (!product.categoryId) {
            batchTimings["category_with_parent"] = 0;
            return { category: null, subcategory: null };
          }

          // Fetch category with parent using Drizzle eager loading
          const category = await db.query.categories.findFirst({
            where: eq(categories.id, product.categoryId),
            with: {
              parentCategory: true,
            },
          });

          batchTimings["category_with_parent"] = Math.round(performance.now() - start);
          return {
            category: category || null,
            subcategory: category?.parentCategory || null,
          };
        })(),

        // PHASE 4: Fetch media assets - images and video, but EXCLUDE 3D model for lazy loading
        (async () => {
          const start = performance.now();
          const mediaIds = [...(product.imageIds || [])];
          if (product.primaryImageId) {
            mediaIds.unshift(product.primaryImageId);
          }
          if (product.primaryVideoId) {
            mediaIds.push(product.primaryVideoId);
          }
          const result =
            mediaIds.length > 0
              ? await db.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds))
              : [];
          batchTimings["media"] = Math.round(performance.now() - start);
          return result;
        })(),

        // Fetch certificates
        (async () => {
          const start = performance.now();
          const result =
            product.certificateIds && product.certificateIds.length > 0
              ? await db
                  .select()
                  .from(certificates)
                  .where(
                    and(
                      inArray(certificates.id, product.certificateIds),
                      isNull(certificates.deletedAt),
                    ),
                  )
              : [];
          batchTimings["certificates"] = Math.round(performance.now() - start);
          return result;
        })(),

        // Fetch accessories
        (async () => {
          const start = performance.now();
          const result =
            product.accessoryIds && product.accessoryIds.length > 0
              ? await db
                  .select()
                  .from(accessories)
                  .where(
                    and(
                      inArray(accessories.id, product.accessoryIds),
                      isNull(accessories.deletedAt),
                    ),
                  )
              : [];
          batchTimings["accessories"] = Math.round(performance.now() - start);
          return result;
        })(),

        // CHUNK 2 OPTIMIZATION: Use cached fibers (reference data, rarely changes)
        (async () => {
          const start = performance.now();
          const result = await miscRepo.getFibers();
          batchTimings["fibers_cached"] = Math.round(performance.now() - start);
          return result;
        })(),

        // PHASE 1 TASK 7: Deduplicated query - fetch 12 products once (used for both related + category)
        // This eliminates duplicate categoryProducts + relatedProducts queries (2→1 query)
        (async () => {
          const start = performance.now();
          const result = product.categoryId
            ? await db
                .select(PRODUCT_SUMMARY_COLUMNS)
                .from(products)
                .where(
                  and(
                    eq(products.categoryId, product.categoryId),
                    eq(products.isActive, true),
                    isNull(products.deletedAt),
                  ),
                )
                .orderBy(desc(products.createdAt))
                .limit(12)
            : [];
          batchTimings["categoryProducts"] = Math.round(performance.now() - start);
          // Note: relatedProducts timing removed (derived from categoryProducts post-query)
          return result;
        })(),
      ]);
      queryTimings["2_parallel_batch"] = Math.round(performance.now() - batchQueryStart);
      queryTimings["total_db_time"] = Math.round(performance.now() - queryStart);

      // CHUNK 2 INSTRUMENTATION: Log detailed query timings
      logger.info(
        `[ProductRepo] [CHUNK 2] Query timings for ${urlPath}: ${JSON.stringify(queryTimings)}`,
      );
      logger.info(
        `[ProductRepo] [CHUNK 2] Query breakdown: main=${queryTimings["1_main_product"]}ms, batch=${queryTimings["2_parallel_batch"]}ms, total=${queryTimings["total_db_time"]}ms`,
      );
      logger.info(`[ProductRepo] [CHUNK 2] Batch breakdown: ${JSON.stringify(batchTimings)}`);

      // Extract batch query results
      const category = categoryWithParent.category;
      const subcategory = categoryWithParent.subcategory;
      // fabric and sizeChart now extracted from main query (lines 493-494)

      // Extract media results
      const media = mediaResult;
      const certificatesData = certificatesResult || [];
      const accessoriesData = accessoriesResult || [];

      // Build category tree and breadcrumb
      const categoryTree: any[] = [];
      if (category) {
        categoryTree.push(category);
        if (subcategory) categoryTree.unshift(subcategory);
      }

      const breadcrumb = categoryTree.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        url: `/categories/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")}`,
      }));

      // PHASE 1 TASK 7: Derive relatedProducts + categoryProducts from single query result
      // Filter out current product for relatedProducts (first 5)
      const productsExcludingCurrent = allCategoryProductsResult.filter((p) => p.id !== product.id);
      const relatedProducts = productsExcludingCurrent.slice(0, 5);
      const categoryProducts = allCategoryProductsResult.slice(0, 10);

      // Navigation: Find current product in batch (might be -1 if product not in top 12)
      const currentIndex = allCategoryProductsResult.findIndex((p) => p.id === product.id);
      // Guard: Only set navigation if current product found in batch
      const previousProduct = currentIndex > 0 ? allCategoryProductsResult[currentIndex - 1] : null;
      const nextProduct =
        currentIndex >= 0 && currentIndex < allCategoryProductsResult.length - 1
          ? allCategoryProductsResult[currentIndex + 1]
          : null;

      return {
        product: {
          ...product,
          canonicalUrl: product.urlPath,
        },
        context: {
          category,
          subcategory,
          categoryTree,
          breadcrumb,
          fabric,
          certificates: certificatesData,
          sizeChart,
          accessories: accessoriesData,
          fibers: fibersData,
        },
        media,
        relatedProducts, // Derived from allCategoryProductsResult (no separate query)
        categoryProducts,
        navigation: {
          previousProduct,
          nextProduct,
        },
      };
    }, "getProductByPath");

    perfTracker.setCacheHit(false).complete();

    if (result !== null) {
      try {
        logger.info(
          `[ProductRepo] Setting cache for product path: ${urlPath} (TTL: ${PRODUCT_CACHE_TTL}ms)`,
        );
        await unifiedCache.set(cacheKey, result, PRODUCT_CACHE_TTL);
        logger.info(`[ProductRepo] ✅ Cache SET successful for product path: ${urlPath}`);
      } catch (cacheError) {
        logger.warn(`[ProductRepository] Failed to cache product ${urlPath}:`, cacheError);
      }
    } else {
      // NEGATIVE CACHING: Cache 404 results for 10 minutes to prevent bot probes from hitting DB
      const NEGATIVE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
      try {
        logger.info(
          `[ProductRepo] Setting negative cache for 404 path: ${urlPath} (TTL: ${NEGATIVE_CACHE_TTL}ms)`,
        );
        await unifiedCache.set(
          cacheKey,
          { __notFound: true, timestamp: Date.now() },
          NEGATIVE_CACHE_TTL,
        );
        logger.info(`[ProductRepo] ✅ Negative cache SET successful for 404 path: ${urlPath}`);
      } catch (cacheError) {
        logger.warn(`[ProductRepository] Failed to set negative cache for ${urlPath}:`, cacheError);
      }
    }

    return result;
  }

  async getProductsByTag(
    tag: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ProductSummary[]> {
    return await db
      .select(PRODUCT_SUMMARY_COLUMNS)
      .from(products)
      .where(
        and(
          sql`${products.tags} @> ${JSON.stringify([tag])}`,
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getRelatedProducts(productId: number): Promise<ProductSummary[]> {
    const sourceProduct = await db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!sourceProduct.length || !sourceProduct[0]!.categoryId) return [];

    return await db
      .select(PRODUCT_SUMMARY_COLUMNS)
      .from(products)
      .where(
        and(
          eq(products.categoryId, sourceProduct[0]!.categoryId),
          ne(products.id, productId),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(5);
  }

  async getActiveProducts(): Promise<ProductSummary[]> {
    return await this.getProducts();
  }

  async getFeaturedProducts(): Promise<ProductSummary[]> {
    const rows = await db
      .select({
        ...PRODUCT_SUMMARY_COLUMNS,
        categoryName: categories.name,
        primaryImageUrl: mediaAssets.url,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(mediaAssets, eq(products.primaryImageId, mediaAssets.id))
      .where(
        and(eq(products.isFeatured, true), eq(products.isActive, true), isNull(products.deletedAt)),
      )
      .orderBy(desc(products.createdAt));

    return rows.map((row) => ({
      ...row,
      category: row.categoryName ? { name: row.categoryName } : null,
      primaryImage: row.primaryImageUrl ? { url: row.primaryImageUrl } : null,
    })) as any;
  }

  async searchProducts(
    query: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ProductSummary[]> {
    return await db
      .select(PRODUCT_SUMMARY_COLUMNS)
      .from(products)
      .where(
        and(
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`),
            like(products.sku, `%${query}%`),
          ),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createProduct(product: InsertProduct, tx?: DbClient): Promise<Product> {
    const dbInstance = tx || db;
    const [created] = await dbInstance.insert(products).values(product).returning();

    if (!tx) {
      await this.invalidateProductCache();
      await this.invalidateProductCount(); // PHASE 1 TASK 8: Invalidate count cache
    }

    return created!;
  }

  async updateProduct(
    id: number,
    product: Partial<InsertProduct>,
    tx?: DbClient,
  ): Promise<Product | undefined> {
    const dbInstance = tx || db;
    const [updated] = await dbInstance
      .update(products)
      .set({ ...product, updatedAt: sql`NOW()` })
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning();

    if (!tx && updated) {
      await this.invalidateProductCache();
      await this.invalidateProductCount(); // PHASE 1 TASK 8: Invalidate count cache
    }

    return updated;
  }

  async deleteProduct(id: number, tx?: DbClient): Promise<boolean> {
    const dbInstance = tx || db;
    const result = await dbInstance
      .update(products)
      .set({ deletedAt: sql`NOW()`, updatedAt: sql`NOW()` })
      .where(eq(products.id, id));

    const success = (result.rowCount ?? 0) > 0;

    if (!tx && success) {
      await this.invalidateProductCache();
      await this.invalidateProductCount(); // PHASE 1 TASK 8: Invalidate count cache
    }

    return success;
  }

  // =============================================================================
  // CATEGORY METHODS
  // =============================================================================

  async getCategories(limit?: number, offset?: number): Promise<Category[]> {
    const cacheKey =
      limit && offset !== undefined ? `categories:active:${limit}:${offset}` : "categories:active";

    try {
      const cached = await unifiedCache.get<Category[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get categories from cache:", error);
    }

    // CHUNK 10: JOIN with media_assets to get media URL
    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        parentId: categories.parentId,
        primaryImageId: categories.primaryImageId,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        level: categories.level,
        fullPath: categories.fullPath,
        metaTitle: categories.metaTitle,
        metaDescription: categories.metaDescription,
        featuredOnHomepage: categories.featuredOnHomepage,
        gridPosition: categories.gridPosition,
        displayOrder: categories.displayOrder,
        featuredContent: categories.featuredContent,
        bannerUrl: categories.bannerUrl,
        imageUrl: categories.imageUrl,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        deletedAt: categories.deletedAt,
        version: categories.version,
        // Media fields from JOIN
        mediaUrl: mediaAssets.url,
        mediaFilename: mediaAssets.filename,
      })
      .from(categories)
      .leftJoin(mediaAssets, eq(categories.primaryImageId, mediaAssets.id))
      .where(isNull(categories.deletedAt))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    if (limit !== undefined) {
      query = query.limit(limit) as typeof query;
      if (offset !== undefined) {
        query = query.offset(offset) as typeof query;
      }
    }

    const result = (await query) as any[];

    try {
      await unifiedCache.set(cacheKey, result, CATEGORY_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }
    return result as Category[];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    // CHUNK 10: JOIN with media_assets to get media URL
    const [category] = (await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        parentId: categories.parentId,
        primaryImageId: categories.primaryImageId,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        level: categories.level,
        fullPath: categories.fullPath,
        metaTitle: categories.metaTitle,
        metaDescription: categories.metaDescription,
        featuredOnHomepage: categories.featuredOnHomepage,
        gridPosition: categories.gridPosition,
        displayOrder: categories.displayOrder,
        featuredContent: categories.featuredContent,
        bannerUrl: categories.bannerUrl,
        imageUrl: categories.imageUrl,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        deletedAt: categories.deletedAt,
        version: categories.version,
        // Media fields from JOIN
        mediaUrl: mediaAssets.url,
        mediaFilename: mediaAssets.filename,
      })
      .from(categories)
      .leftJoin(mediaAssets, eq(categories.primaryImageId, mediaAssets.id))
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))) as any[];
    return category as Category | undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    // SEO-friendly category lookup by slug with caching
    const cacheKey = `categories:slug:${slug}`;

    try {
      const cached = await unifiedCache.get<Category>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get category by slug from cache:", error);
    }

    const [category] = (await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        parentId: categories.parentId,
        primaryImageId: categories.primaryImageId,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        level: categories.level,
        fullPath: categories.fullPath,
        metaTitle: categories.metaTitle,
        metaDescription: categories.metaDescription,
        featuredOnHomepage: categories.featuredOnHomepage,
        gridPosition: categories.gridPosition,
        displayOrder: categories.displayOrder,
        featuredContent: categories.featuredContent,
        bannerUrl: categories.bannerUrl,
        imageUrl: categories.imageUrl,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        deletedAt: categories.deletedAt,
        version: categories.version,
        // Media fields from JOIN
        mediaUrl: mediaAssets.url,
        mediaFilename: mediaAssets.filename,
      })
      .from(categories)
      .leftJoin(mediaAssets, eq(categories.primaryImageId, mediaAssets.id))
      .where(and(eq(categories.slug, slug), isNull(categories.deletedAt)))) as any[];

    if (category) {
      try {
        await unifiedCache.set(cacheKey, category, CATEGORY_CACHE_TTL, "data");
      } catch (error) {
        logger.debug("[Cache] Failed to set category by slug cache:", error);
      }
    }

    return category as Category | undefined;
  }

  async getCategoriesCount(): Promise<number> {
    const cacheKey = "categories:count";
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(isNull(categories.deletedAt));

    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL);
    return count;
  }

  async createCategory(category: InsertCategory, tx?: DbClient): Promise<Category> {
    const dbInstance = tx || db;
    const result = await dbInstance.insert(categories).values(category).returning();

    if (Array.isArray(result) && result.length > 0) {
      if (!tx) {
        await this.invalidateCategoryCache();
      }
      return result[0]!;
    }
    throw new Error("Failed to create category");
  }

  async updateCategory(
    id: number,
    category: Partial<InsertCategory>,
    tx?: DbClient,
  ): Promise<Category | undefined> {
    const dbInstance = tx || db;
    const [updated] = (await dbInstance
      .update(categories)
      .set({ ...category, updatedAt: sql`NOW()` })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning()) as Category[];

    if (!tx && updated) {
      await this.invalidateCategoryCache();
    }

    return updated;
  }

  async deleteCategory(id: number, tx?: DbClient): Promise<boolean> {
    const dbInstance = tx || db;
    const result = await dbInstance
      .update(categories)
      .set({ deletedAt: sql`NOW()`, updatedAt: sql`NOW()` })
      .where(eq(categories.id, id));

    const success = (result.rowCount ?? 0) > 0;

    if (!tx && success) {
      await this.invalidateCategoryCache();
      await unifiedCache.delete("categories:deleted");
    }

    return success;
  }

  // DELETED CATEGORIES MANAGEMENT
  async getDeletedCategories(): Promise<Category[]> {
    const cacheKey = "categories:deleted";
    const perfTracker = queryPerformanceMonitor.startQuery("getDeletedCategories");

    try {
      const cached = await unifiedCache.get<Category[]>(cacheKey, "data");
      if (cached) {
        perfTracker.setCacheHit(true).complete();
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get deleted categories from cache:", error);
    }

    const result = await dbCircuitBreaker.execute(async () => {
      return await db
        .select()
        .from(categories)
        .where(sql`${categories.deletedAt} IS NOT NULL`)
        .orderBy(desc(categories.deletedAt));
    }, "getDeletedCategories");

    perfTracker.setCacheHit(false).complete();

    try {
      await unifiedCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes cache
    } catch (error) {
      logger.debug("[Cache] Failed to cache deleted categories:", error);
    }

    return result;
  }

  async restoreCategory(id: number, tx?: DbClient): Promise<boolean> {
    const dbInstance = tx || db;
    const result = await dbInstance
      .update(categories)
      .set({ deletedAt: null, updatedAt: sql`NOW()` })
      .where(eq(categories.id, id));

    const success = (result.rowCount ?? 0) > 0;

    if (!tx && success) {
      await this.invalidateCategoryCache();
      await unifiedCache.delete("categories:deleted");
    }

    return success;
  }

  async permanentlyDeleteCategory(id: number, tx?: DbClient): Promise<boolean> {
    const dbInstance = tx || db;

    // Hard delete - permanently removes the record
    const result = await dbInstance.delete(categories).where(eq(categories.id, id));

    const success = (result.rowCount ?? 0) > 0;

    if (!tx && success) {
      await this.invalidateCategoryCache();
      await unifiedCache.delete("categories:deleted");
    }

    return success;
  }

  // =============================================================================
  // PHASE 4: LAZY 3D MODEL METADATA ENDPOINT
  // =============================================================================

  /**
   * PHASE 4: Fetch 3D model metadata ONLY when user activates the viewer
   * This reduces NEON database queries by 90% (only fetched for viewers)
   */
  async get3DModelMetadata(productId: number): Promise<any | null> {
    const cacheKey = `product:${productId}:3d-model`;
    const perfTracker = queryPerformanceMonitor.startQuery("get3DModelMetadata");

    // Check cache first
    const cached = await unifiedCache.get<any>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      return cached;
    }

    const result = await dbCircuitBreaker.execute(async () => {
      // Fetch product to get modelFileId
      const [product] = await db
        .select({ modelFileId: products.modelFileId })
        .from(products)
        .where(
          and(eq(products.id, productId), eq(products.isActive, true), isNull(products.deletedAt)),
        );

      if (!product || !product.modelFileId) {
        return null;
      }

      // Fetch the 3D model asset metadata
      const [modelAsset] = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, product.modelFileId));

      return modelAsset || null;
    }, "get3DModelMetadata");

    if (result) {
      // Cache for 15 minutes (same as product TTL)
      await unifiedCache.set(cacheKey, result, PRODUCT_CACHE_TTL);
    }

    perfTracker.complete();
    return result;
  }

  // =============================================================================
  // CACHE INVALIDATION - PRIVATE
  // =============================================================================

  private async invalidateProductCache(): Promise<void> {
    try {
      await unifiedCache.clearPattern("^products:");
      await unifiedCache.clearPattern("^product:by-path:");
      await unifiedCache.clearPattern("^homepage:featured-products:");
    } catch (error) {
      logger.debug("[ProductRepository] Cache invalidation failed (non-critical):", error);
    }
  }

  private async invalidateCategoryCache(): Promise<void> {
    try {
      await unifiedCache.clearPattern("categories:active");
      await unifiedCache.delete("categories:count");
    } catch (error) {
      logger.debug("[ProductRepository] Cache invalidation failed (non-critical):", error);
    }
  }
}
