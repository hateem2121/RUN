import {
  boolean,
  index,
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { sizeCharts } from "./catalog";
import { categories } from "./categories";
import { pgTable } from "./common";
import { fabrics } from "./materials";
import { mediaAssets } from "./media";

// Schemas for JSONB columns
const ProductTechnicalSpecsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
);
const ProductFiberCompositionSchema = z.record(z.string(), z.union([z.string(), z.number()]));
const ProductVideoSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  type: z.string().optional(),
  thumbnail: z.string().optional(),
});
const ProductMetadataSchema = z.record(z.string(), z.any());

/**
 * Products Table - Core Product Catalog
 * 
 * @table products
 * @description Primary table for athletic apparel products in the B2B catalog.
 * Stores product details, media references, specifications, and B2B-specific fields.
 * 
 * @business Products are the core business entity. All products must belong to a category
 * and have a unique SKU for inventory tracking.
 * 
 * @relationships
 * - `categoryId` → `categories.id` (required, restrict delete)
 * - `primaryImageId`, `primaryVideoId`, `modelFileId` → `mediaAssets.id` (optional, set null)
 * - `fabricId` → `fabrics.id` (optional, set null)
 * - `sizeChartId` → `sizeCharts.id` (optional, set null)
 * 
 * @performance Includes 12+ indexes for optimized query paths including:
 * - Category filtering, active/featured status
 * - SKU lookups, fabric relationships
 * - URL path resolution, hot query optimization
 * - GIN indexes for JSONB array containment (created via migrations)
 * 
 * @softDelete Uses `deletedAt` timestamp for soft delete support
 * 
 * @example
 * ```typescript
 * // Fetch active products in a category
 * const products = await db.select()
 *   .from(products)
 *   .where(and(
 *     eq(products.categoryId, categoryId),
 *     eq(products.isActive, true),
 *     isNull(products.deletedAt)
 *   ));
 * ```
 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull().unique(),
    description: text(),
    shortDescription: text(),

    // Category relationship - HARDENED CASCADE RULE
    categoryId: integer()
      .references(() => categories.id, {
        onDelete: "restrict", // PROTECT: Don't allow category deletion if products exist
      })
      .notNull(), // REQUIRED: All products must have a category
    // REMOVED 2025-11-14: categoryPath column (never populated - client-side path computation used)

    // Primary media
    primaryImageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    primaryVideoId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    modelFileId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Business fields
    sku: varchar({ length: 100 }).notNull(), // REQUIRED for inventory tracking

    // B2B specific
    minimumOrderQuantity: integer().default(1),
    leadTime: varchar({ length: 100 }),

    // Product specifications - Note: specifications is array format, technicalSpecs is key-value object format
    specifications: jsonb().$type<string[]>(),
    technicalSpecs: jsonb().$type<z.infer<typeof ProductTechnicalSpecsSchema>>(),
    fiberComposition: jsonb().$type<z.infer<typeof ProductFiberCompositionSchema>>(), // Fiber/material breakdown
    tags: jsonb().$type<string[]>(),
    careInstructions: jsonb().$type<string[]>(),

    // Additional media properties
    imageIds: jsonb().$type<number[]>(), // Array of media asset IDs for product gallery
    videos: jsonb().$type<z.infer<typeof ProductVideoSchema>[]>(), // Array of video objects
    urlPath: varchar({ length: 500 }), // SEO-friendly URL path

    // Custom product properties
    customWeight: varchar({ length: 100 }),
    customFit: varchar({ length: 100 }),
    customizationOptions: jsonb().$type<string[]>(), // Product customization options for B2B clients

    // Relationships to other entities
    fabricId: integer().references(() => fabrics.id, {
      onDelete: "set null",
    }),
    sizeChartId: integer().references(() => sizeCharts.id, {
      onDelete: "set null",
    }),
    certificateIds: jsonb().$type<number[]>(),
    accessoryIds: jsonb().$type<number[]>(),
    // TODO: Candidate for deprecation - Currently used in PRODUCT_DETAIL_COLUMNS
    // Plan: Refactor to derive related products from categoryProducts context (see getProductByPath)
    // Once refactored, mark with @deprecated and set removal timeline
    // Related: server/lib/repositories/product-repository.ts line 680 (categoryProducts derivation)
    relatedProductIds: jsonb().$type<number[]>(),

    // SEO
    metaTitle: varchar({ length: 255 }),
    metaDescription: text(),
    metadata: jsonb().$type<z.infer<typeof ProductMetadataSchema>>(), // Additional product metadata

    // Status
    isActive: boolean().default(true),
    isFeatured: boolean().default(false),

    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp({ mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for product queries - CRITICAL for 50ms query times
    index("products_category_id_idx").on(table.categoryId),
    index("products_is_active_idx").on(table.isActive),
    index("products_is_featured_idx").on(table.isFeatured),
    index("products_active_created_idx").on(table.isActive, table.createdAt.desc()),
    index("products_featured_active_idx").on(table.isFeatured, table.isActive),
    index("products_category_active_idx").on(table.categoryId, table.isActive),
    // PERFORMANCE FIX: Index for SKU lookups (inventory tracking)
    index("products_sku_idx").on(table.sku),
    // PERFORMANCE FIX: Index for fabric relationship queries
    index("products_fabric_id_idx").on(table.fabricId),
    // CRITICAL PERFORMANCE: Composite index for urlPath lookups (getProductByPath query)
    index("products_url_path_active_idx").on(table.urlPath, table.isActive, table.deletedAt),
    // PHASE 2D: Hot query index for homepage/products listing (deleted_at IS NULL, is_active = true, ORDER BY created_at DESC)
    index("products_hot_query_idx").on(table.deletedAt, table.isActive, table.createdAt.desc()),
    // AUDIT FIX: Foreign key indexes for media relationships (prevents slow JOINs)
    index("products_primary_image_id_idx").on(table.primaryImageId),
    index("products_primary_video_id_idx").on(table.primaryVideoId),
    index("products_model_file_id_idx").on(table.modelFileId),
    // NOTE: GIN trigram indexes for ILIKE search optimization created via migration:
    // - products_name_trgm_idx (migrations/optimizations/004_add_trigram_indexes.sql)
    // - products_description_trgm_idx (migrations/optimizations/004_add_trigram_indexes.sql)
    // NOTE: GIN indexes for JSONB array containment queries created via migration:
    // - products_tags_gin_idx (migrations/optimizations/002_add_jsonb_gin_indexes.sql)
    // - products_certificate_ids_gin_idx (migrations/optimizations/002_add_jsonb_gin_indexes.sql)
    // - products_accessory_ids_gin_idx (migrations/optimizations/002_add_jsonb_gin_indexes.sql)
    // - products_image_ids_gin_idx (migrations/optimizations/002_add_jsonb_gin_indexes.sql)
  ],
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export const selectProductSchema = createSelectSchema(products);

// Optimized Product types for efficient queries (matches backend column selections)
export type ProductSummary = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "sku"
  | "description"
  | "primaryImageId"
  | "primaryVideoId"
  | "imageIds"
  | "videos"
  | "minimumOrderQuantity"
  | "leadTime"
  | "careInstructions"
  | "technicalSpecs"
  | "customFit"
  | "fiberComposition"
  | "specifications"
  | "isActive"
  | "isFeatured"
  | "categoryId"
  | "fabricId"
  | "certificateIds"
  | "sizeChartId"
  | "accessoryIds"
  | "tags"
  | "urlPath"
  | "createdAt"
>;

export type ProductDetail = Pick<
  Product,
  | "id"
  | "name"
  | "sku"
  | "slug"
  | "description"
  | "shortDescription"
  | "isActive"
  | "isFeatured"
  | "categoryId"
  | "fabricId"
  | "sizeChartId"
  | "primaryImageId"
  | "primaryVideoId"
  | "imageIds"
  | "videos"
  | "modelFileId"
  | "specifications"
  | "technicalSpecs"
  | "careInstructions"
  | "tags"
  | "customWeight"
  | "customFit"
  | "minimumOrderQuantity"
  | "leadTime"
  | "certificateIds"
  | "accessoryIds"
  | "relatedProductIds"
  | "customizationOptions"
  | "metaTitle"
  | "metaDescription"
  | "urlPath"
  | "createdAt"
  | "updatedAt"
>;

// Zod Schema
export const insertProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.number().min(1, "Category ID is required"),
  categoryPath: z.string().optional(),

  // Media associations
  primaryImageId: z.number().optional().nullable(),
  primaryVideoId: z.number().optional().nullable(),
  modelFileId: z.number().optional().nullable(),
  imageIds: z.array(z.number()).optional(),
  videos: z.array(ProductVideoSchema).optional(),

  // Business fields
  sku: z.string().min(1, "SKU is required"),

  // B2B specific
  minimumOrderQuantity: z.number().min(1).optional(),
  leadTime: z.string().optional(),

  // Product specifications
  specifications: z.array(z.string()).optional(),
  technicalSpecs: ProductTechnicalSpecsSchema.optional(),
  fiberComposition: ProductFiberCompositionSchema.optional(),
  tags: z.array(z.string()).optional(),
  careInstructions: z.array(z.string()).optional(),

  // Additional properties
  urlPath: z.string().optional(),
  customWeight: z.string().optional(),
  customFit: z.string().optional(),
  customizationOptions: z.array(z.string()).optional(),

  // Relationships to other entities
  fabricId: z.number().optional().nullable(),
  sizeChartId: z.number().optional().nullable(),
  certificateIds: z.array(z.number()).optional(),
  accessoryIds: z.array(z.number()).optional(),
  // TODO: Candidate for deprecation - See Drizzle schema comment above
  relatedProductIds: z.array(z.number()).optional(),

  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),

  // Status
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});
