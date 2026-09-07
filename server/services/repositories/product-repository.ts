/**
 * PRODUCT REPOSITORY
 * Handles product and category operations with caching and performance monitoring
 */

import type {
  Accessory,
  Category,
  Certificate,
  Fabric,
  InsertCategory,
  InsertProduct,
  MediaAsset,
  Product,
  ProductDetail,
  ProductSummary,
  SizeChart,
} from "@run-remix/shared";
import { categories, mediaAssets, productRelations, products } from "@run-remix/shared";
import { and, asc, desc, eq, isNull, lt, ne, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import * as dbModule from "../../db.js";
import { type DbClient, db } from "../../db.js";
import { CacheKeys, InvalidationPatterns } from "../../lib/cache/cache-keys.js";
import type { RepositoryCacheOptions } from "../../lib/cache/cache-strategies.js";
import { UnifiedCache } from "../../lib/cache/unified-cache.js";
import { dbCircuitBreaker } from "../../lib/db/db-circuit-breaker.js";
import { queryPerformanceMonitor } from "../../lib/db/query-performance.js";
import { logger } from "../../lib/monitoring/logger.js";
import { StorageSingleton } from "../../lib/storage-singleton.js";
import { MiscRepository } from "./misc-repository.js";

// Use stateless HTTP database driver for read-only catalog queries in serverless (falls back to db in tests)
let readDb: DbClient = db;
try {
  const maybeHttpDb = (dbModule as Record<string, unknown>).httpDb;
  if (maybeHttpDb) {
    readDb = maybeHttpDb as DbClient;
  }
} catch {
  readDb = db;
}
const unifiedCache = UnifiedCache.getInstance();
const miscRepo = new MiscRepository();

// Re-export ProductSummary and ProductDetail for callers
export type { ProductDetail, ProductSummary };

import type { ProductDetailWithContext } from "./storage-interfaces.js";

// Cache TTL in seconds (UnifiedCache.set expects seconds)
const PRODUCT_CACHE_TTL = 3600; // 60 minutes (3600 seconds)
const CATEGORY_CACHE_TTL = 14400; // 4 hours (14400 seconds)

// Column selection for product summary (listings, cards)
// Matches ProductSummary type from schema.ts
const PRODUCT_SUMMARY_COLUMNS = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  sku: products.sku,
  description: products.description,
  shortDescription: products.shortDescription,
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
  metadata: products.metadata,
  urlPath: products.urlPath,
  fiberComposition: products.fiberComposition,

  // Timestamps
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  deletedAt: products.deletedAt,
} as const;

function mapDbRowToCamel<T = Record<string, unknown>>(
  row: Record<string, unknown> | null | undefined,
): T | null {
  if (!row || typeof row !== "object") return null;
  const res: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    if (
      typeof value === "string" &&
      (camelKey === "createdAt" ||
        camelKey === "updatedAt" ||
        camelKey === "deletedAt" ||
        camelKey === "publishedAt")
    ) {
      res[camelKey] = new Date(value);
    } else {
      res[camelKey] = value;
    }
  }
  return res as T;
}

export interface ProductByPathQueryResult {
  product: ProductDetail;
  fabric: Fabric | null;
  sizeChart: SizeChart | null;
  category: Category | null;
  subcategory: Category | null;
  media: MediaAsset[];
  certificates: Certificate[];
  accessories: Accessory[];
  categoryProducts: ProductSummary[];
  relatedProducts: ProductSummary[];
}

interface RawProductCteRow {
  product: Record<string, unknown> | null;
  fabric: Record<string, unknown> | null;
  size_chart: Record<string, unknown> | null;
  category: Record<string, unknown> | null;
  subcategory: Record<string, unknown> | null;
  media: Record<string, unknown>[] | null;
  certificates: Record<string, unknown>[] | null;
  accessories: Record<string, unknown>[] | null;
  category_products: Record<string, unknown>[] | null;
  related_products: Record<string, unknown>[] | null;
}

export async function executeProductByPathSingleQuery(
  urlPath: string,
  dbClient: DbClient = readDb,
): Promise<ProductByPathQueryResult | null> {
  if (!dbClient || typeof dbClient.execute !== "function") {
    return null;
  }

  const alternatePath = urlPath.startsWith("/") ? urlPath.slice(1) : `/${urlPath}`;

  const query = sql`
    WITH target_product AS (
      SELECT
        p.*,
        to_jsonb(f.*) AS fabric_data,
        to_jsonb(sc.*) AS size_chart_data
      FROM products p
      LEFT JOIN fabrics f ON p.fabric_id = f.id AND f.deleted_at IS NULL
      LEFT JOIN size_charts sc ON p.size_chart_id = sc.id AND sc.deleted_at IS NULL
      WHERE (p.url_path = ${urlPath} OR p.url_path = ${alternatePath})
        AND p.is_active = true
        AND p.deleted_at IS NULL
      LIMIT 1
    ),
    category_data AS (
      SELECT
        to_jsonb(c.*) AS category_json,
        to_jsonb(pc.*) AS subcategory_json
      FROM target_product tp
      LEFT JOIN categories c ON tp.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
    ),
    media_data AS (
      SELECT COALESCE(
        jsonb_agg(to_jsonb(m.*) ORDER BY CASE
          WHEN m.id = tp.primary_image_id THEN 0
          WHEN m.id = tp.primary_video_id THEN 2
          ELSE 1
        END) FILTER (WHERE m.id IS NOT NULL),
        '[]'::jsonb
      ) AS media_json
      FROM target_product tp
      LEFT JOIN media_assets m ON (
        m.id = tp.primary_image_id
        OR (tp.image_ids IS NOT NULL AND tp.image_ids @> to_jsonb(m.id))
        OR m.id = tp.primary_video_id
      )
    ),
    certificates_data AS (
      SELECT COALESCE(
        jsonb_agg(to_jsonb(cert.*)) FILTER (WHERE cert.id IS NOT NULL),
        '[]'::jsonb
      ) AS certificates_json
      FROM target_product tp
      LEFT JOIN certificates cert ON (
        tp.certificate_ids IS NOT NULL
        AND tp.certificate_ids @> to_jsonb(cert.id)
        AND cert.deleted_at IS NULL
      )
    ),
    accessories_data AS (
      SELECT COALESCE(
        jsonb_agg(to_jsonb(acc.*)) FILTER (WHERE acc.id IS NOT NULL),
        '[]'::jsonb
      ) AS accessories_json
      FROM target_product tp
      LEFT JOIN accessories acc ON (
        tp.accessory_ids IS NOT NULL
        AND tp.accessory_ids @> to_jsonb(acc.id)
        AND acc.deleted_at IS NULL
      )
    ),
    category_products_data AS (
      SELECT COALESCE(
        jsonb_agg(to_jsonb(cp_sub.*)) FILTER (WHERE cp_sub.id IS NOT NULL),
        '[]'::jsonb
      ) AS category_products_json
      FROM (
        SELECT cp.id, cp.name, cp.slug, cp.sku, cp.description, cp.short_description,
               cp.primary_image_id, cp.price, cp.compare_at_price, cp.currency,
               cp.is_active, cp.is_featured, cp.rating, cp.review_count,
               cp.tags, cp.badge, cp.created_at, cp.url_path, cp.category_id
        FROM target_product tp
        JOIN products cp ON cp.category_id = tp.category_id
          AND cp.is_active = true
          AND cp.deleted_at IS NULL
        ORDER BY cp.created_at DESC
        LIMIT 12
      ) cp_sub
    ),
    related_products_data AS (
      SELECT COALESCE(
        jsonb_agg(to_jsonb(rp_sub.*)) FILTER (WHERE rp_sub.id IS NOT NULL),
        '[]'::jsonb
      ) AS related_products_json
      FROM (
        SELECT p.id, p.name, p.slug, p.sku, p.description, p.short_description,
               p.primary_image_id, p.price, p.compare_at_price, p.currency,
               p.is_active, p.is_featured, p.rating, p.review_count,
               p.tags, p.badge, p.created_at, p.url_path, p.category_id
        FROM target_product tp
        JOIN product_relations pr ON pr.product_id = tp.id
        JOIN products p ON pr.related_product_id = p.id
          AND p.is_active = true
          AND p.deleted_at IS NULL
        ORDER BY pr.sort_order ASC, p.created_at DESC
        LIMIT 10
      ) rp_sub
    )
    SELECT
      to_jsonb(tp.*) AS product,
      tp.fabric_data AS fabric,
      tp.size_chart_data AS size_chart,
      cd.category_json AS category,
      cd.subcategory_json AS subcategory,
      md.media_json AS media,
      certs.certificates_json AS certificates,
      ad.accessories_json AS accessories,
      cpd.category_products_json AS category_products,
      rpd.related_products_json AS related_products
    FROM target_product tp
    CROSS JOIN category_data cd
    CROSS JOIN media_data md
    CROSS JOIN certificates_data certs
    CROSS JOIN accessories_data ad
    CROSS JOIN category_products_data cpd
    CROSS JOIN related_products_data rpd
  `;

  const rawResult = await dbClient.execute(query);
  const rows = (
    Array.isArray(rawResult) ? rawResult : ((rawResult as { rows?: unknown[] })?.rows ?? [])
  ) as RawProductCteRow[];

  const row = rows[0];
  if (!row?.product) {
    return null;
  }

  const product = mapDbRowToCamel<ProductDetail>(row.product)!;
  const fabric = mapDbRowToCamel<Fabric>(row.fabric);
  const sizeChart = mapDbRowToCamel<SizeChart>(row.size_chart);
  const category = mapDbRowToCamel<Category>(row.category);
  const subcategory = mapDbRowToCamel<Category>(row.subcategory);

  const media = (row.media || []).map((m) => mapDbRowToCamel<MediaAsset>(m)!);
  const certificates = (row.certificates || []).map((c) => mapDbRowToCamel<Certificate>(c)!);
  const accessories = (row.accessories || []).map((a) => mapDbRowToCamel<Accessory>(a)!);
  const categoryProducts = (row.category_products || []).map(
    (p) => mapDbRowToCamel<ProductSummary>(p)!,
  );
  const relatedProducts = (row.related_products || []).map(
    (p) => mapDbRowToCamel<ProductSummary>(p)!,
  );

  return {
    product,
    fabric,
    sizeChart,
    category,
    subcategory,
    media,
    certificates,
    accessories,
    categoryProducts,
    relatedProducts,
  };
}

export class ProductRepository {
  // =============================================================================
  // PRODUCT METHODS
  // =============================================================================

  // EXPERIMENTAL: Cursor-based pagination for high-performance scrolling
  // Avoids OFFSET performance penalty for deep pages
  async getProductsCursor(
    limit: number = 20,
    cursor?: number, // using ID as cursor
  ): Promise<ProductSummary[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsCursor(limit, cursor);
    }
    const conditions = [eq(products.isActive, true), isNull(products.deletedAt)];

    if (cursor) {
      // Fetch items with ID < cursor (assuming descending order)
      conditions.push(lt(products.id, cursor));
    }

    return await dbCircuitBreaker.execute(async () => {
      return await readDb
        .select(PRODUCT_SUMMARY_COLUMNS)
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.id))
        .limit(limit);
    }, "getProductsCursor");
  }

  async getProducts(limit: number = 100, offset: number = 0): Promise<ProductSummary[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProducts(limit, offset);
    }
    const cacheKey = `products:${limit}:${offset}`;
    const perfTracker = queryPerformanceMonitor.startQuery("getProducts");

    const cached = await unifiedCache.get<ProductSummary[]>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      return cached;
    }

    const result = await dbCircuitBreaker.execute(async () => {
      const rows = await readDb
        .select({
          product: PRODUCT_SUMMARY_COLUMNS,
          imageVariants: mediaAssets.imageVariants,
          mediaAssetUrl: mediaAssets.url,
        })
        .from(products)
        .leftJoin(mediaAssets, eq(products.primaryImageId, mediaAssets.id))
        .where(and(eq(products.isActive, true), isNull(products.deletedAt)))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);

      // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
      return rows.map((row: any) => ({
        ...row.product,
        imageUrl:
          row.mediaAssetUrl ||
          (row.product.primaryImageId
            ? `/api/media/${row.product.primaryImageId}/content`
            : undefined),
        imageVariants: row.imageVariants,
      }));
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
  ): Promise<{ products: ProductSummary[]; totalCount: number }> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsSummary(limit, offset, options);
    }
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
            products: ProductSummary[];
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
        const summaryProducts = await readDb
          .select(PRODUCT_SUMMARY_COLUMNS)
          .from(products)
          .where(and(eq(products.isActive, true), isNull(products.deletedAt)))
          .orderBy(desc(products.createdAt))
          .limit(limit)
          .offset(offset);

        return { products: summaryProducts as ProductSummary[], totalCount };
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

  async getHomepageFeaturedProducts(limit: number = 20): Promise<ProductSummary[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageFeaturedProducts(limit);
    }
    const cacheKey = `homepage:featured-products:${limit}`;
    const perfTracker = queryPerformanceMonitor.startQuery("getHomepageFeaturedProducts");

    const cached = await unifiedCache.get<ProductSummary[]>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      return cached;
    }

    const result = await dbCircuitBreaker.execute(async () => {
      const rows = await readDb
        .select({
          product: PRODUCT_SUMMARY_COLUMNS,
          imageVariants: mediaAssets.imageVariants,
          mediaAssetUrl: mediaAssets.url,
        })
        .from(products)
        .leftJoin(mediaAssets, eq(products.primaryImageId, mediaAssets.id))
        .where(and(eq(products.isActive, true), isNull(products.deletedAt)))
        .orderBy(desc(products.isFeatured), desc(products.createdAt))
        .limit(limit);

      // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
      return rows.map((row: any) => ({
        ...row.product,
        imageUrl:
          row.mediaAssetUrl ||
          (row.product.primaryImageId
            ? `/api/media/${row.product.primaryImageId}/content`
            : undefined),
        imageVariants: row.imageVariants,
      }));
    }, "getHomepageFeaturedProducts");

    perfTracker.setCacheHit(false).complete();
    await unifiedCache.set(cacheKey, result, PRODUCT_CACHE_TTL);

    return result as ProductSummary[];
  }

  // PHASE 1 TASK 8: Product count cache with 1-hour TTL
  // Used by getProductsSummary to avoid COUNT(*) OVER() window function overhead
  async getProductCount(): Promise<number> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsCount();
    }
    const cacheKey = CacheKeys.products.totalCount();
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const result = await readDb
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
    // Also invalidate featured count as featured products change frequently
    await unifiedCache.delete("products:count:featured");

    // Invalidate category, tag, and search count caches to prevent stale pagination/metadata
    await unifiedCache.invalidate("^products:count:category:");
    await unifiedCache.invalidate("^products:count:tag:");
    await unifiedCache.invalidate("^products:count:search:");

    logger.info(
      "[ProductRepo] Product count caches invalidated (including category, tag, and search counts)",
    );
  }

  async getProductsByCategoryCount(categoryId: number): Promise<number> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsByCategoryCount(categoryId);
    }
    const cacheKey = `products:count:category:${categoryId}`;
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const result = await readDb
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
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsByTagCount(tag);
    }
    const cacheKey = `products:count:tag:${tag}`;
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const result = await readDb
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

  async searchProductsCount(
    query: string,
    filters: {
      categoryId?: number;
      isActive?: boolean;
      isFeatured?: boolean;
    } = {},
  ): Promise<number> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().searchProductsCount(query, filters);
    }
    const cacheKey = `products:count:search:${query}`;
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const result = await readDb
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          sql`search_vector @@ websearch_to_tsquery('english', ${query})`,
          filters.categoryId ? eq(products.categoryId, filters.categoryId) : undefined,
          filters.isActive !== undefined
            ? eq(products.isActive, filters.isActive)
            : eq(products.isActive, true),
          filters.isFeatured !== undefined
            ? eq(products.isFeatured, filters.isFeatured)
            : undefined,
          isNull(products.deletedAt),
        ),
      );

    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL);
    return count;
  }

  private async getRelationIdsForProduct(productId: number): Promise<number[]> {
    try {
      const relations = await readDb
        .select({ relatedProductId: productRelations.relatedProductId })
        .from(productRelations)
        .where(eq(productRelations.productId, productId))
        .orderBy(asc(productRelations.sortOrder));

      if (Array.isArray(relations)) {
        return relations
          .map((r) => r?.relatedProductId)
          .filter((id): id is number => typeof id === "number" && id > 0);
      }
      return [];
    } catch {
      return [];
    }
  }

  async getProduct(id: number): Promise<ProductDetail | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProduct(id);
    }
    const cacheKey = CacheKeys.products.item(id);
    const cached = await unifiedCache.get<ProductDetail>(cacheKey);
    if (cached) {
      return cached;
    }

    const [product] = await readDb
      .select(PRODUCT_DETAIL_COLUMNS)
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)));

    if (product) {
      const relationIds = await this.getRelationIdsForProduct(product.id);
      const finalProduct: ProductDetail =
        relationIds.length > 0 ? { ...product, relatedProductIds: relationIds } : product;
      await unifiedCache.set(cacheKey, finalProduct, PRODUCT_CACHE_TTL);
      return finalProduct;
    }

    return product;
  }

  async getProductsByCategory(
    categoryId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ProductSummary[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsByCategory(categoryId, limit, offset);
    }
    return await readDb
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

  // PREPARED STATEMENT for hot-path slug lookup
  private getProductBySlugQuery = db
    .select(PRODUCT_DETAIL_COLUMNS)
    .from(products)
    .where(
      and(
        eq(products.slug, sql.placeholder("slug")),
        eq(products.isActive, true),
        isNull(products.deletedAt),
      ),
    )
    .prepare("get_product_by_slug");

  async getProductBySlug(slug: string): Promise<ProductDetail | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductBySlug(slug);
    }
    const [product] = await this.getProductBySlugQuery.execute({ slug });
    if (product) {
      const relationIds = await this.getRelationIdsForProduct(product.id);
      return relationIds.length > 0 ? { ...product, relatedProductIds: relationIds } : product;
    }
    return product;
  }

  async getProductByPath(
    urlPath: string,
    productSlug?: string,
  ): Promise<ProductDetailWithContext | null> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductByPath(urlPath);
    }
    const resolvedPath = productSlug
      ? `/${urlPath.replace(/^\/+/, "").replace(/\/+$/, "")}/${productSlug.replace(/^\/+/, "")}`
      : urlPath;
    const cacheKey = `product:by-path:${resolvedPath}`;
    const perfTracker = queryPerformanceMonitor.startQuery("getProductByPath");

    const cached = await unifiedCache.get<ProductDetailWithContext | { __notFound: true }>(
      cacheKey,
    );
    if (cached) {
      // Check if this is a cached 404 (negative cache)
      if ("__notFound" in cached && cached.__notFound === true) {
        logger.info(`[ProductRepo] ✅ Cache HIT (404) for product path: ${resolvedPath}`);
        perfTracker.setCacheHit(true).complete();
        return null;
      }
      logger.info(`[ProductRepo] ✅ Cache HIT for product path: ${resolvedPath}`);
      perfTracker.setCacheHit(true).complete();
      return cached as ProductDetailWithContext;
    }
    logger.info(
      `[ProductRepo] ❌ Cache MISS for product path: ${resolvedPath} - querying database`,
    );

    const result = await dbCircuitBreaker.execute(async () => {
      const queryStart = performance.now();
      const singleQueryResult = await executeProductByPathSingleQuery(resolvedPath, readDb);
      const dbDuration = Math.round(performance.now() - queryStart);

      if (!singleQueryResult) {
        logger.info(
          `[ProductRepo] [DB-02 CTE] Query timings (404): ${dbDuration}ms for path ${resolvedPath}`,
        );
        return null;
      }

      const {
        product,
        fabric,
        sizeChart,
        category,
        subcategory,
        media,
        certificates: certificatesData,
        accessories: accessoriesData,
        categoryProducts: allCategoryProductsResult,
        relatedProducts: manuallyRelatedProducts,
      } = singleQueryResult;

      const fibersData = await miscRepo.getFibers();

      const categoryTree: Category[] = [];
      if (category) {
        categoryTree.push(category);
        if (subcategory) {
          categoryTree.unshift(subcategory);
        }
      }

      const breadcrumb = categoryTree.map((cat) => ({
        id: cat.id,
        name: cat.name,
        url: `/categories/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")}`,
      }));

      const productsExcludingCurrent = allCategoryProductsResult.filter((p) => p.id !== product.id);

      const relatedProducts =
        manuallyRelatedProducts.length > 0
          ? manuallyRelatedProducts
          : productsExcludingCurrent.slice(0, 5);

      const categoryProducts = allCategoryProductsResult.slice(0, 10);

      const currentIndex = allCategoryProductsResult.findIndex((p) => p.id === product.id);
      const previousProduct =
        currentIndex > 0 ? allCategoryProductsResult[currentIndex - 1] || null : null;
      const nextProduct =
        currentIndex >= 0 && currentIndex < allCategoryProductsResult.length - 1
          ? allCategoryProductsResult[currentIndex + 1] || null
          : null;

      logger.info(
        `[ProductRepo] [DB-02 CTE] Consolidated query timings for ${resolvedPath}: total=${dbDuration}ms`,
      );

      return {
        product: {
          ...product,
          canonicalUrl: product.urlPath || resolvedPath,
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
        relatedProducts,
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
          `[ProductRepo] Setting cache for product path: ${resolvedPath} (TTL: ${PRODUCT_CACHE_TTL}s)`,
        );
        await unifiedCache.set(cacheKey, result, PRODUCT_CACHE_TTL);
        logger.info(`[ProductRepo] ✅ Cache SET successful for product path: ${resolvedPath}`);
      } catch (cacheError) {
        logger.warn(`[ProductRepository] Failed to cache product ${resolvedPath}:`, cacheError);
      }
    } else {
      const NEGATIVE_CACHE_TTL = 600; // 10 minutes (600 seconds)
      try {
        logger.info(
          `[ProductRepo] Setting negative cache for 404 path: ${resolvedPath} (TTL: ${NEGATIVE_CACHE_TTL}s)`,
        );
        await unifiedCache.set(
          cacheKey,
          { __notFound: true, timestamp: Date.now() },
          NEGATIVE_CACHE_TTL,
        );
        logger.info(`[ProductRepo] ✅ Negative cache SET successful for 404 path: ${resolvedPath}`);
      } catch (cacheError) {
        logger.warn(
          `[ProductRepository] Failed to set negative cache for ${resolvedPath}:`,
          cacheError,
        );
      }
    }

    return result;
  }

  async getProductsByTag(
    tag: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ProductSummary[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsByTag(tag, limit, offset);
    }
    return await readDb
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
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getRelatedProducts(productId);
    }
    const sourceProduct = await readDb
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    const categoryId = sourceProduct[0]?.categoryId;
    if (!categoryId) {
      return [];
    }

    // PHASE 3: Attempt to fetch from proper relations table first
    const relations = await readDb
      .select({
        ...PRODUCT_SUMMARY_COLUMNS,
        relationId: productRelations.id,
        sortOrder: productRelations.sortOrder,
      })
      .from(productRelations)
      .innerJoin(
        products,
        and(
          eq(productRelations.relatedProductId, products.id),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .where(eq(productRelations.productId, productId))
      .orderBy(asc(productRelations.sortOrder), desc(products.createdAt))
      .limit(5);

    if (relations.length > 0) {
      // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
      return relations.map(({ relationId, sortOrder, ...p }: any) => p);
    }

    // Fallback to category-based logic
    return await readDb
      .select(PRODUCT_SUMMARY_COLUMNS)
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          ne(products.id, productId),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(5);
  }

  async getActiveProducts(): Promise<ProductSummary[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getActiveProducts();
    }
    return await this.getProducts();
  }

  async getFeaturedProducts(limit = 100, offset = 0): Promise<ProductSummary[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFeaturedProducts(limit, offset);
    }
    const rows = await readDb
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
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
    return rows.map((row: any) => ({
      ...row,
      category: row.categoryName ? { name: row.categoryName } : null,
      primaryImage: row.primaryImageUrl ? { url: row.primaryImageUrl } : null,
    })) as unknown as ProductSummary[];
  }

  async getFeaturedProductsCount(): Promise<number> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFeaturedProductsCount();
    }
    const cacheKey = "products:count:featured";
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    const result = await readDb
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(eq(products.isFeatured, true), eq(products.isActive, true), isNull(products.deletedAt)),
      );
    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL);
    return count;
  }

  async searchProducts(
    query: string,
    filters: {
      categoryId?: number;
      isActive?: boolean;
      isFeatured?: boolean;
    } = {},
    limit: number = 100,
    offset: number = 0,
  ): Promise<ProductSummary[]> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().searchProducts(query, filters, limit, offset);
    }
    return await readDb
      .select({
        ...PRODUCT_SUMMARY_COLUMNS,
        rank: sql<number>`ts_rank(search_vector, websearch_to_tsquery('english', ${query}))`.as(
          "rank",
        ),
      })
      .from(products)
      .where(
        and(
          sql`search_vector @@ websearch_to_tsquery('english', ${query})`,
          filters.categoryId ? eq(products.categoryId, filters.categoryId) : undefined,
          filters.isActive !== undefined
            ? eq(products.isActive, filters.isActive)
            : eq(products.isActive, true),
          filters.isFeatured !== undefined
            ? eq(products.isFeatured, filters.isFeatured)
            : undefined,
          isNull(products.deletedAt),
        ),
      )
      .orderBy(desc(sql`rank`), desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createProduct(product: InsertProduct, tx?: DbClient): Promise<Result<Product, Error>> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return ok(await StorageSingleton.getInstance().createProduct(product));
    }
    return await dbCircuitBreaker.execute(
      async () => {
        const dbInstance = tx || db;

        // Extract relatedProductIds for separate processing if present
        const { relatedProductIds: relatedIds, ...productData } = product;

        const [created] = await dbInstance.insert(products).values(productData).returning();

        if (!created) {
          return err(new Error("Failed to create product"));
        }

        // PHASE 4B: Normalize relationships
        if (relatedIds && Array.isArray(relatedIds) && relatedIds.length > 0) {
          await dbInstance.insert(productRelations).values(
            relatedIds.map((rid, idx) => ({
              productId: created.id,
              relatedProductId: rid,
              sortOrder: idx,
            })),
          );
        }

        if (!tx) {
          await this.invalidateProductCache();
          await this.invalidateProductCount(); // PHASE 1 TASK 8: Invalidate count cache
        }

        return ok(await created);
      },
      "createProduct",
      { isIdempotent: false },
    );
  }

  async updateProduct(
    id: number,
    product: Partial<InsertProduct>,
    tx?: DbClient,
  ): Promise<Product | undefined> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateProduct(id, product);
    }
    return await dbCircuitBreaker.execute(
      async () => {
        const dbInstance = tx || db;

        // Extract relatedProductIds for separate processing if present
        const { relatedProductIds: relatedIds, ...productData } = product;

        const [updated] = await dbInstance
          .update(products)
          .set({ ...productData, updatedAt: sql`NOW()` })
          .where(and(eq(products.id, id), isNull(products.deletedAt)))
          .returning();

        // PHASE 4B: Normalize relationships
        if (updated && relatedIds !== undefined) {
          // Clear existing and replace with new
          await dbInstance.delete(productRelations).where(eq(productRelations.productId, id));

          if (Array.isArray(relatedIds) && relatedIds.length > 0) {
            await dbInstance.insert(productRelations).values(
              relatedIds.map((rid, idx) => ({
                productId: id,
                relatedProductId: rid,
                sortOrder: idx,
              })),
            );
          }
        }

        if (!tx && updated) {
          await this.invalidateProductCache();
          await this.invalidateProductCount(); // PHASE 1 TASK 8: Invalidate count cache
        }

        return updated;
      },
      "updateProduct",
      { isIdempotent: false },
    );
  }

  async deleteProduct(id: number, tx?: DbClient): Promise<boolean> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteProduct(id);
    }
    return await dbCircuitBreaker.execute(
      async () => {
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
      },
      "deleteProduct",
      { isIdempotent: false },
    );
  }

  async getProductsCount(): Promise<number> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsCount();
    }
    return await this.getProductCount();
  }

  async getProductsIncludingDeleted(limit: number = 50, offset: number = 0): Promise<Product[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getProductsIncludingDeleted(limit, offset);
    }
    return await readDb
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async restoreProduct(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().restoreProduct(id);
    }
    return await dbCircuitBreaker.execute(
      async () => {
        const dbInstance = tx || db;
        const result = await dbInstance
          .update(products)
          .set({ deletedAt: null, updatedAt: sql`NOW()` })
          .where(eq(products.id, id));

        const success = (result.rowCount ?? 0) > 0;

        if (!tx && success) {
          await this.invalidateProductCache();
          await this.invalidateProductCount();
        }

        return success;
      },
      "restoreProduct",
      { isIdempotent: false },
    );
  }

  async permanentlyDeleteProduct(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().permanentlyDeleteProduct(id);
    }
    return await dbCircuitBreaker.execute(
      async () => {
        const dbInstance = tx || db;
        const result = await dbInstance.delete(products).where(eq(products.id, id));

        const success = (result.rowCount ?? 0) > 0;

        if (!tx && success) {
          await this.invalidateProductCache();
          await this.invalidateProductCount();
        }

        return success;
      },
      "permanentlyDeleteProduct",
      { isIdempotent: false },
    );
  }

  // =============================================================================
  // CATEGORY METHODS
  // =============================================================================

  async getCategories(limit?: number, offset?: number): Promise<Category[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCategories(limit, offset);
    }
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
    let query = readDb
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
    } else {
      query = query.limit(50) as typeof query;
    }

    const result = (await query) as Category[];

    try {
      await unifiedCache.set(cacheKey, result, CATEGORY_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }
    return result;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCategory(id);
    }
    // CHUNK 10: JOIN with media_assets to get media URL
    const [category] = (await readDb
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
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))) as unknown as Category[];
    return category as Category | undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCategoryBySlug(slug);
    }
    // SEO-friendly category lookup by slug with caching
    const cacheKey = `categories:slug:${slug}`;

    try {
      const cached = await unifiedCache.get<Category>(cacheKey, "data");
      if (cached && cached.slug === slug && !cached.deletedAt) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get category by slug from cache:", error);
    }

    const [category] = (await readDb
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
      .where(
        and(eq(categories.slug, slug), isNull(categories.deletedAt)),
      )) as unknown as Category[];

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
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCategoriesCount();
    }
    const cacheKey = "categories:count";
    const cached = await unifiedCache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const result = await readDb
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(isNull(categories.deletedAt));

    const count = result[0]?.count ?? 0;
    await unifiedCache.set(cacheKey, count, PRODUCT_CACHE_TTL);
    return count;
  }

  async createCategory(category: InsertCategory, tx?: DbClient): Promise<Result<Category, Error>> {
    if (StorageSingleton.hasInstance()) {
      return ok(await StorageSingleton.getInstance().createCategory(category));
    }
    return await dbCircuitBreaker.execute(
      async () => {
        const dbInstance = tx || db;
        const result = await dbInstance.insert(categories).values(category).returning();

        if (Array.isArray(result) && result.length > 0) {
          if (!tx) {
            await this.invalidateCategoryCache();
          }
          return ok(await result[0]!);
        }
        return err(new Error("Failed to create category"));
      },
      "createCategory",
      { isIdempotent: false },
    );
  }

  async updateCategory(
    id: number,
    category: Partial<InsertCategory>,
    tx?: DbClient,
  ): Promise<Category | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateCategory(id, category);
    }
    return await dbCircuitBreaker.execute(
      async () => {
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
      },
      "updateCategory",
      { isIdempotent: false },
    );
  }

  async deleteCategory(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteCategory(id);
    }
    return await dbCircuitBreaker.execute(
      async () => {
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
      },
      "deleteCategory",
      { isIdempotent: false },
    );
  }

  // DELETED CATEGORIES MANAGEMENT
  async getDeletedCategories(): Promise<Category[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getDeletedCategories();
    }
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
      return await readDb
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

  // Helper method matching facade behavior for migration consistency
  async getCategoriesIncludingDeleted(
    limit: number = 1000,
    offset: number = 0,
  ): Promise<Category[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCategoriesIncludingDeleted(limit, offset);
    }
    return (await readDb
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name))
      .limit(limit)
      .offset(offset)) as Category[];
  }

  async restoreCategory(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().restoreCategory(id);
    }
    return await dbCircuitBreaker.execute(
      async () => {
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
      },
      "restoreCategory",
      { isIdempotent: false },
    );
  }

  async permanentlyDeleteCategory(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().permanentlyDeleteCategory(id);
    }
    return await dbCircuitBreaker.execute(
      async () => {
        const dbInstance = tx || db;

        // Hard delete - permanently removes the record
        const result = await dbInstance.delete(categories).where(eq(categories.id, id));

        const success = (result.rowCount ?? 0) > 0;

        if (!tx && success) {
          await this.invalidateCategoryCache();
          await unifiedCache.delete("categories:deleted");
        }

        return success;
      },
      "permanentlyDeleteCategory",
      { isIdempotent: false },
    );
  }

  // =============================================================================
  // PHASE 4: LAZY 3D MODEL METADATA ENDPOINT
  // =============================================================================

  /**
   * PHASE 4: Fetch 3D model metadata ONLY when user activates the viewer
   * This reduces NEON database queries by 90% (only fetched for viewers)
   */
  async get3DModelMetadata(productId: number): Promise<MediaAsset | null> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().get3DModelMetadata(productId);
    }
    const cacheKey = `product:${productId}:3d-model`;
    const perfTracker = queryPerformanceMonitor.startQuery("get3DModelMetadata");

    // Check cache first
    const cached = await unifiedCache.get<MediaAsset>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      return cached;
    }

    const result = await dbCircuitBreaker.execute(async () => {
      // Fetch product to get modelFileId
      const [product] = await readDb
        .select({ modelFileId: products.modelFileId })
        .from(products)
        .where(
          and(eq(products.id, productId), eq(products.isActive, true), isNull(products.deletedAt)),
        );

      if (!product?.modelFileId) {
        return null;
      }

      // Fetch the 3D model asset metadata
      const [modelAsset] = await readDb
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
      // Use standardized invalidation patterns
      await unifiedCache.clearPattern(InvalidationPatterns.products);
      // Also clear affected homepage sections (featured products)
      await unifiedCache.clearPattern(InvalidationPatterns.homepage);
      logger.info("[ProductRepository] Product cache invalidated selectively");
    } catch (error) {
      logger.error("[ProductRepository] Cache invalidation failed:", error);
    }
  }

  private async invalidateCategoryCache(): Promise<void> {
    try {
      // Invalidate all product and category-related cache when categories change
      await unifiedCache.clearPattern("^categories:");
      await unifiedCache.clearPattern("^products:");
      await unifiedCache.clearPattern(InvalidationPatterns.products);
      await unifiedCache.delete(CacheKeys.products.categories());
      await unifiedCache.delete(CacheKeys.products.totalCount());
    } catch (error) {
      logger.error("[ProductRepository] Category cache invalidation failed:", error);
    }
  }
}
