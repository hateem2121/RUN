// PostgreSQL Schema with Drizzle ORM
// This is the main schema file that drizzle.config.ts uses

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTableCreator,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Create custom table creator (fixes deprecation warnings in Drizzle ORM 0.44+)
const pgTable = pgTableCreator((name) => name);

// =============================================================================
// REPLIT AUTH TABLES
// Reference: https://docs.replit.com/hosting/deployments/replit-authn
// Cost Optimization: https://neon.tech/docs/guides/node
// ✓ CHECKPOINT: PHASE-1-SCHEMA-ADDED
// =============================================================================

/**
 * Session storage table (REQUIRED by connect-pg-simple)
 * Stores encrypted session data with automatic expiration cleanup
 * TTL: 7 days (604800000ms) managed by connect-pg-simple
 */
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { mode: "date", precision: 3 }).notNull(),
  },
  (table) => [
    // PERFORMANCE: Index for session cleanup queries (DELETE WHERE expire < NOW())
    // Prevents full table scans during automatic session cleanup
    index("IDX_session_expire").on(table.expire),
  ],
);

/**
 * Users table (REQUIRED by Replit Auth)
 * Auto-populated via OpenID Connect on first login
 * Admin promotion must be done manually via SQL
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Replit user ID (stable, unique)
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: text("profile_image_url"),

  // ROLE-BASED ACCESS CONTROL
  // Admin status NOT auto-updated on login - must be set via SQL
  isAdmin: boolean("is_admin").default(false).notNull(),

  // Timestamps for audit trail
  createdAt: timestamp("created_at", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

// Export types for type safety across backend and frontend
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// =============================================================================
// CORE BUSINESS ENTITIES WITH PROPER FOREIGN KEY RELATIONSHIPS
// =============================================================================

// Categories with hierarchical self-reference
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),

    // Self-referencing hierarchy - HARDENED FK INTEGRITY
    parentId: integer("parent_id"),

    // Primary image reference - HARDENED CASCADE
    // TODO: Consider adding an index for faster queries
    primaryImageId: integer("primary_image_id").references(
      () => mediaAssets.id,
      { onDelete: "set null" }, // SAFE: Category can exist without image
    ),

    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    level: integer("level").default(0),
    fullPath: varchar("full_path", { length: 500 }),

    // SEO fields
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),

    // Enhanced fields
    featuredOnHomepage: boolean("featured_on_homepage").default(false),
    gridPosition: integer("grid_position").default(0), // Missing property for grid layout
    displayOrder: integer("display_order").default(0), // Display order for sorting
    // REMOVED 2025-11-14: productCount column (never updated - COUNT queries used instead)
    featuredContent: jsonb("featured_content").$type<Record<string, any>>(),
    bannerUrl: varchar("banner_url", { length: 500 }), // Banner image URL for category pages
    imageUrl: varchar("image_url", { length: 500 }), // Direct image URL (alternative to primaryImageId)

    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),

    // OPTIMISTIC LOCKING: Version field for concurrent access control (Phase 2.3)
    version: integer("version").default(1).notNull(),
  },
  (table) => [
    // Self-referencing foreign key - defined here to avoid implicit 'any' during type inference
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "categories_parent_id_fk",
    }).onDelete("set null"), // SAFE: Child categories become top-level if parent deleted
    // PERFORMANCE INDEXES for hot query paths
    index("categories_is_active_idx").on(table.isActive),
    index("categories_parent_id_idx").on(table.parentId),
    index("categories_active_created_idx").on(table.isActive, table.createdAt.desc()),
    index("categories_featured_idx").on(table.featuredOnHomepage),
    // PERFORMANCE FIX: Index for hierarchical category queries
    index("categories_full_path_idx").on(table.fullPath),
    // CRITICAL FIX: Partial unique index for slug that respects soft-deletes
    // Allows reusing slugs after categories are deleted
    uniqueIndex("categories_slug_unique_active")
      .on(table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

// Media Assets for file storage
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: serial("id").primaryKey(),
    filename: varchar("filename", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }),
    fileSize: integer("file_size"),
    size: integer("size"), // Alias for fileSize for compatibility
    mimeType: varchar("mime_type", { length: 100 }).notNull(), // REQUIRED for proper file handling

    // File organization
    type: varchar("type", { length: 50 }).notNull(), // 'image', 'video', 'model', 'document'
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailFilename: varchar("thumbnail_filename", { length: 255 }), // For thumbnail reference
    thumbnailStoragePath: text("thumbnail_storage_path"), // Thumbnail storage path in GCS
    imageVariants: jsonb("image_variants").$type<{
      thumbnail?: string; // 200px - for cards/grids (<50KB)
      medium?: string; // 800px - for product pages (<200KB)
      large?: string; // 1600px - for lightbox/detail (<500KB)
      original?: string; // Compressed original (<500KB)
    }>(),

    // Storage information - HARDENED: NOT NULL constraints to prevent storage issues
    storagePath: text("storage_path").notNull(),
    bucketName: varchar("bucket_name", { length: 100 }).notNull(),

    // Organization
    folderId: integer("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    tags: jsonb("tags").$type<string[]>(),

    // Enhanced metadata
    altText: text("alt_text"),
    caption: text("caption"),
    metadata: jsonb("metadata")
      .$type<Record<string, any>>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    // REMOVED 2025-11-14: Usage tracking columns (never updated - tracking not implemented)
    // - downloadCount: integer("download_count").default(0)
    // - lastAccessedAt: timestamp("last_accessed_at")
    // NOTE: size column is RETAINED despite being duplicate of fileSize
    // Reason: Actively used in 16+ frontend locations - requires separate refactoring task
    uploadedAt: timestamp("uploaded_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(), // For upload timestamp

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for media queries
    index("media_type_active_idx").on(table.type, table.isActive),
    index("media_folder_id_idx").on(table.folderId),
    index("media_created_at_idx").on(table.createdAt.desc()),
    index("media_active_created_idx").on(table.isActive, table.createdAt.desc()),
    index("media_mime_type_idx").on(table.mimeType),
    // CRITICAL: Composite index for hot query path (deleted_at IS NULL, is_active = true, ORDER BY created_at DESC)
    index("media_hot_query_idx").on(table.deletedAt, table.isActive, table.createdAt.desc()),
    // PERFORMANCE: Index for getMediaAsset by ID lookups
    index("media_id_active_idx").on(table.id, table.isActive, table.deletedAt),
    // PERFORMANCE FIX: Index for LIKE queries on originalName (media search)
    index("media_original_name_idx").on(table.originalName),
    // PERFORMANCE: Index for uploadedAt sorting queries
    index("media_uploaded_at_idx").on(table.uploadedAt.desc()),
    // NOTE: GIN trigram indexes for ILIKE search optimization created via migration:
    // - media_assets_filename_trgm_idx (migrations/optimizations/004_add_trigram_indexes.sql)
    // - media_assets_original_name_trgm_idx (migrations/optimizations/004_add_trigram_indexes.sql)
    // - media_assets_alt_text_trgm_idx (migrations/optimizations/004_add_trigram_indexes.sql)
  ],
);

// Products table
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    shortDescription: text("short_description"),

    // Category relationship - HARDENED CASCADE RULE
    categoryId: integer("category_id")
      .references(() => categories.id, {
        onDelete: "restrict", // PROTECT: Don't allow category deletion if products exist
      })
      .notNull(), // REQUIRED: All products must have a category
    // REMOVED 2025-11-14: categoryPath column (never populated - client-side path computation used)

    // Primary media
    primaryImageId: integer("primary_image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    primaryVideoId: integer("primary_video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    modelFileId: integer("model_file_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Business fields
    sku: varchar("sku", { length: 100 }).notNull(), // REQUIRED for inventory tracking

    // B2B specific
    minimumOrderQuantity: integer("minimum_order_quantity").default(1),
    leadTime: varchar("lead_time", { length: 100 }),

    // Product specifications - Note: specifications is array format, technicalSpecs is key-value object format
    specifications: jsonb("specifications").$type<string[]>(),
    technicalSpecs: jsonb("technical_specs").$type<Record<string, any>>(),
    fiberComposition: jsonb("fiber_composition").$type<Record<string, any>>(), // Fiber/material breakdown
    tags: jsonb("tags").$type<string[]>(),
    careInstructions: jsonb("care_instructions").$type<string[]>(),

    // Additional media properties
    imageIds: jsonb("image_ids").$type<number[]>(), // Array of media asset IDs for product gallery
    videos: jsonb("videos").$type<Record<string, any>[]>(), // Array of video objects
    urlPath: varchar("url_path", { length: 500 }), // SEO-friendly URL path

    // Custom product properties
    customWeight: varchar("custom_weight", { length: 100 }),
    customFit: varchar("custom_fit", { length: 100 }),
    customizationOptions: jsonb("customization_options").$type<string[]>(), // Product customization options for B2B clients

    // Relationships to other entities
    fabricId: integer("fabric_id").references(() => fabrics.id, {
      onDelete: "set null",
    }),
    sizeChartId: integer("size_chart_id").references(() => sizeCharts.id, {
      onDelete: "set null",
    }),
    certificateIds: jsonb("certificate_ids").$type<number[]>(),
    accessoryIds: jsonb("accessory_ids").$type<number[]>(),
    // TODO: Candidate for deprecation - Currently used in PRODUCT_DETAIL_COLUMNS
    // Plan: Refactor to derive related products from categoryProducts context (see getProductByPath)
    // Once refactored, mark with @deprecated and set removal timeline
    // Related: server/lib/repositories/product-repository.ts line 680 (categoryProducts derivation)
    relatedProductIds: jsonb("related_product_ids").$type<number[]>(),

    // SEO
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional product metadata

    // Status
    isActive: boolean("is_active").default(true),
    isFeatured: boolean("is_featured").default(false),

    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
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

// Fabrics
export const fabrics = pgTable(
  "fabrics",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    fabricType: varchar("fabric_type", { length: 100 }),

    // PRODUCT ESSENCE - B2B Core Fields
    sport: text("sport"), // Sport category (Running, Cycling, Training, etc.)
    marketSegment: text("market_segment"), // Market segment (Premium, Performance, Mass Market, etc.)
    seasonality: text("seasonality"), // Seasonal use (All-Season, Summer, Winter, Spring/Fall)

    // Technical specifications
    weight: varchar("weight", { length: 50 }),
    weave: varchar("weave", { length: 100 }),
    weaveType: varchar("weave_type", { length: 100 }), // Weave type alias for compatibility
    weaveTypes: jsonb("weave_types").$type<string[]>(), // Array of weave types
    stretch: varchar("stretch", { length: 50 }),
    finishTreatment: varchar("finish_treatment", { length: 255 }), // Fabric finishing treatment

    // Properties - Stores structured technical data including:
    // - compositions: Array<{name, isDefault, fibers: Array<{fiberId, percentage}>}>
    // - Performance: stretchPercentage, enhancedMoistureManagement, wickingRate, dryingTime, performanceFeatures[], airPermeability, waterColumn
    // - Durability: colorfastness, tensileStrength, tearStrength, abrasionResistance, pillingGrade, shrinkageTolerancePercentage, washTemperature, yarnCountConstruction
    // - Care: washCareInstructions {careSymbols[], instructions, restrictions[]}
    // - Sustainability: endOfLifeOptions[]
    properties: jsonb("properties").$type<Record<string, any>>(),
    careInstructions: text("care_instructions"),

    // Sustainability
    sustainabilityScore: integer("sustainability_score"),
    certifications: jsonb("certifications").$type<string[]>(),

    // Visual and application fields
    visualSwatchId: integer("visual_swatch_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // Visual swatch media
    keyApplications: jsonb("key_applications").$type<string[]>(), // Key applications/uses for this fabric

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for fabric queries
    index("fabrics_is_active_idx").on(table.isActive),
    index("fabrics_fabric_type_idx").on(table.fabricType),
    index("fabrics_sport_idx").on(table.sport),
    index("fabrics_seasonality_idx").on(table.seasonality),
    index("fabrics_deleted_at_idx").on(table.deletedAt),
    index("fabrics_active_query_idx").on(table.deletedAt, table.isActive),
  ],
);

// Fibers (base materials)
export const fibers = pgTable(
  "fibers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(), // Required type field for fabrics
    description: text("description"),

    // Business fields
    sustainabilityScore: integer("sustainability_score"),
    environmentalImpact: text("environmental_impact"),
    properties: jsonb("properties").$type<Record<string, any>>(),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for fiber queries
    index("fibers_type_idx").on(table.type),
    index("fibers_is_active_idx").on(table.isActive),
    index("fibers_deleted_at_idx").on(table.deletedAt),
  ],
);

// =============================================================================
// CONTENT MANAGEMENT SYSTEM ENTITIES
// =============================================================================

// Homepage Hero
export const homepageHero = pgTable(
  "homepage_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    backgroundImageId: integer("background_image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_hero_is_active_idx").on(table.isActive),
    index("homepage_hero_background_image_id_idx").on(table.backgroundImageId),
    index("homepage_hero_sort_order_idx").on(table.sortOrder),
  ],
);

// Homepage Slogans
export const homepageSlogans = pgTable(
  "homepage_slogans",
  {
    id: serial("id").primaryKey(),
    text: text("text").notNull(),
    position: varchar("position", { length: 50 }),
    fontSize: varchar("font_size", { length: 20 }),
    color: varchar("color", { length: 20 }),
    animationType: varchar("animation_type", { length: 50 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_slogans_is_active_idx").on(table.isActive),
    index("homepage_slogans_sort_order_idx").on(table.sortOrder),
  ],
);

// Homepage Process Cards
export const homepageProcessCards = pgTable(
  "homepage_process_cards",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    iconName: varchar("icon_name", { length: 100 }),
    step: integer("step").notNull(),

    // Additional fields to match frontend expectations
    icon: varchar("icon", { length: 100 }), // For text/emoji icons
    iconMediaId: integer("icon_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // For image icons
    iconType: varchar("icon_type", { length: 20 }), // 'text' or 'image'
    category: varchar("category", { length: 100 }), // process category
    position: integer("position").default(0), // position/order

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_process_cards_is_active_idx").on(table.isActive),
    index("homepage_process_cards_image_id_idx").on(table.imageId),
    index("homepage_process_cards_icon_media_id_idx").on(table.iconMediaId),
    index("homepage_process_cards_sort_order_idx").on(table.sortOrder),
  ],
);

// Homepage Sections
export const homepageSections = pgTable(
  "homepage_sections",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    heroTitle: varchar("hero_title", { length: 255 }), // Additional hero title field for compatibility
    content: text("content"),
    sectionType: varchar("section_type", { length: 100 }).notNull(),
    data: jsonb("data").$type<Record<string, any>>(),
    mediaIds: jsonb("media_ids").$type<number[]>(), // Missing property causing errors
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_sections_is_active_idx").on(table.isActive),
    index("homepage_sections_sort_order_idx").on(table.sortOrder),
  ],
);

// DEPRECATED: homepage_sustainability table removed as part of schema cleanup (2025-12-09)

// Homepage Featured Products Settings
export const homepageFeaturedProductsSettings = pgTable("homepage_featured_products_settings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  maxProducts: integer("max_products").default(8),
  autoSelect: boolean("auto_select").default(true),
  selectedProductIds: jsonb("selected_product_ids").$type<number[]>(),
  sortBy: varchar("sort_by", { length: 50 }).default("featured"),
  isActive: boolean("is_active").default(true),

  // Animation Settings - Phase 4 Schema Alignment
  isEnabled: boolean("is_enabled").default(true),
  dotGrid: jsonb("dot_grid").$type<{
    dotSize: number;
    gap: number;
    baseColor: string;
    activeColor: string;
    proximity: number;
    shockRadius: number;
    shockStrength: number;
    resistance: number;
    returnDuration: number;
  }>(),
  liquidGlass: jsonb("liquid_glass").$type<{
    blur: number;
    opacity: number;
    borderOpacity: number;
    cardHoverScale: number;
  }>(),
  swipeAnimation: jsonb("swipe_animation").$type<{
    transitionDuration: number;
    easing:
      | "ease-out"
      | "ease-in"
      | "ease-in-out"
      | "ease"
      | "linear"
      | "easeIn"
      | "easeOut"
      | "easeInOut";
  }>(),

  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// About Hero
export const aboutHero = pgTable(
  "about_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    description: text("description"),

    // Added for component compatibility
    headline: varchar("headline", { length: 255 }),
    subheadline: text("subheadline"),

    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    backgroundMediaId: integer("background_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_hero_is_active_idx").on(table.isActive),
    index("about_hero_image_id_idx").on(table.imageId),
    index("about_hero_video_id_idx").on(table.videoId),
    index("about_hero_background_media_id_idx").on(table.backgroundMediaId),
  ],
);

// About Timeline Entries
export const aboutTimelineEntries = pgTable(
  "about_timeline_entries",
  {
    id: serial("id").primaryKey(),
    year: varchar("year", { length: 10 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Added for component compatibility
    position: integer("position").default(0),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_timeline_entries_is_active_idx").on(table.isActive),
    index("about_timeline_entries_image_id_idx").on(table.imageId),
    index("about_timeline_entries_sort_order_idx").on(table.sortOrder),
  ],
);

// About Map Locations
export const aboutMapLocations = pgTable(
  "about_map_locations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    description: text("description"),
    address: text("address"),
    locationType: varchar("location_type", { length: 100 }),

    // Added for component compatibility
    type: varchar("type", { length: 50 }),
    city: varchar("city", { length: 255 }),
    country: varchar("country", { length: 255 }),
    details: text("details"),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [index("about_map_locations_is_active_idx").on(table.isActive)],
);

// About Sections
export const aboutSections = pgTable(
  "about_sections",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    sectionType: varchar("section_type", { length: 100 }).notNull(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    data: jsonb("data").$type<Record<string, any>>(),
    mediaIds: jsonb("media_ids").$type<number[]>(),

    // Added for component compatibility
    position: integer("position").default(0),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_sections_is_active_idx").on(table.isActive),
    index("about_sections_image_id_idx").on(table.imageId),
    index("about_sections_sort_order_idx").on(table.sortOrder),
  ],
);

// About Statistics
export const aboutStatistics = pgTable(
  "about_statistics",
  {
    id: serial("id").primaryKey(),
    label: varchar("label", { length: 255 }).notNull(),
    value: varchar("value", { length: 100 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    description: text("description"),
    iconName: varchar("icon_name", { length: 100 }),

    // Added for component compatibility
    icon: varchar("icon", { length: 100 }), // alias for iconName
    position: integer("position").default(0),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_statistics_is_active_idx").on(table.isActive),
    index("about_statistics_sort_order_idx").on(table.sortOrder),
  ],
);

// About Team Messages
export const aboutTeamMessages = pgTable(
  "about_team_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    position: varchar("position", { length: 255 }),
    message: text("message").notNull(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Added for component compatibility
    title: varchar("title", { length: 255 }),
    signature: varchar("signature", { length: 255 }),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_team_messages_is_active_idx").on(table.isActive),
    index("about_team_messages_image_id_idx").on(table.imageId),
    index("about_team_messages_sort_order_idx").on(table.sortOrder),
  ],
);

// =============================================================================
// SUSTAINABILITY & MANUFACTURING ENTITIES
// =============================================================================

// Sustainability Hero
export const sustainabilityHero = pgTable(
  "sustainability_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("sustainability_hero_is_active_idx").on(table.isActive),
    index("sustainability_hero_image_id_idx").on(table.imageId),
    index("sustainability_hero_video_id_idx").on(table.videoId),
  ],
);

// Sustainability Metrics
export const sustainabilityMetrics = pgTable(
  "sustainability_metrics",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    value: varchar("value", { length: 100 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    iconName: varchar("icon_name", { length: 100 }),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("sustainability_metrics_is_active_idx").on(table.isActive),
    index("sustainability_metrics_sort_order_idx").on(table.sortOrder),
  ],
);

// Sustainability Initiatives
export const sustainabilityInitiatives = pgTable(
  "sustainability_initiatives",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    impact: text("impact"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Frontend compatibility: Additional categorization fields
    iconName: varchar("icon_name", { length: 50 }),
    category: varchar("category", { length: 100 }),
    highlightedFeatures: jsonb("highlighted_features").$type<string[]>(), // Key features to highlight

    status: varchar("status", { length: 50 }).default("active"),
    startDate: timestamp("start_date", { mode: "date", precision: 3 }),
    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("sustainability_initiatives_is_active_idx").on(table.isActive),
    index("sustainability_initiatives_image_id_idx").on(table.imageId),
    index("sustainability_initiatives_sort_order_idx").on(table.sortOrder),
  ],
);

// Sustainability Goals
export const sustainabilityGoals = pgTable(
  "sustainability_goals",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    target: varchar("target", { length: 255 }),
    currentProgress: decimal("current_progress", { precision: 5, scale: 2 }),

    // Frontend compatibility: Numeric values for progress tracking
    currentValue: decimal("current_value", { precision: 10, scale: 2 }),
    targetValue: decimal("target_value", { precision: 10, scale: 2 }),
    targetYear: integer("target_year"),
    unit: varchar("unit", { length: 50 }), // Unit for currentValue/targetValue

    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
    category: varchar("category", { length: 100 }),
    priority: varchar("priority", { length: 20 }).default("medium"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("sustainability_goals_is_active_idx").on(table.isActive),
    index("sustainability_goals_sort_order_idx").on(table.sortOrder),
  ],
);

// Manufacturing Hero
export const manufacturingHero = pgTable(
  "manufacturing_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    headline: varchar("headline", { length: 255 }), // Frontend alias for title
    subheadline: text("subheadline"), // Frontend alias for subtitle
    description: text("description"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    backgroundMediaId: integer("background_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // Missing property causing errors
    ctaText: varchar("cta_text", { length: 100 }), // Call-to-action button text
    ctaLink: varchar("cta_link", { length: 255 }), // Call-to-action button link

    // Bottom Call to Action Section
    bottomCtaTitle: varchar("bottom_cta_title", { length: 255 }),
    bottomCtaDescription: text("bottom_cta_description"),
    bottomCtaText: varchar("bottom_cta_text", { length: 100 }),
    bottomCtaLink: varchar("bottom_cta_link", { length: 255 }),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("manufacturing_hero_is_active_idx").on(table.isActive),
    index("manufacturing_hero_image_id_idx").on(table.imageId),
    index("manufacturing_hero_video_id_idx").on(table.videoId),
    index("manufacturing_hero_background_media_id_idx").on(table.backgroundMediaId),
  ],
);

// Manufacturing Processes
export const manufacturingProcesses = pgTable(
  "manufacturing_processes",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }), // Frontend alias for name
    description: text("description"),
    step: integer("step").notNull(),
    position: integer("position"), // Visual position/layout index
    duration: varchar("duration", { length: 100 }),
    efficiency: integer("efficiency"), // Process efficiency metric (0-100 percentage)
    category: varchar("category", { length: 100 }), // Process category/type
    iconName: varchar("icon_name", { length: 100 }), // Icon identifier for UI display
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    mediaIds: jsonb("media_ids").$type<number[]>(), // Additional media for process visualization
    equipment: jsonb("equipment").$type<string[]>(),
    specifications: jsonb("specifications").$type<Record<string, any>>(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("manufacturing_processes_is_active_idx").on(table.isActive),
    index("manufacturing_processes_image_id_idx").on(table.imageId),
    index("manufacturing_processes_sort_order_idx").on(table.sortOrder),
  ],
);

// Manufacturing Capabilities
export const manufacturingCapabilities = pgTable(
  "manufacturing_capabilities",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }), // Frontend alias for name
    description: text("description"),
    capacity: varchar("capacity", { length: 255 }),
    unit: varchar("unit", { length: 50 }),
    category: varchar("category", { length: 100 }),
    icon: varchar("icon", { length: 100 }), // Icon for capability display
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    equipment: jsonb("equipment").$type<string[]>(), // Equipment list for this capability
    specifications: jsonb("specifications").$type<Record<string, any>>(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("manufacturing_capabilities_is_active_idx").on(table.isActive),
    index("manufacturing_capabilities_image_id_idx").on(table.imageId),
    index("manufacturing_capabilities_sort_order_idx").on(table.sortOrder),
  ],
);

// Manufacturing Quality
export const manufacturingQualities = pgTable(
  "manufacturing_qualities",
  {
    id: serial("id").primaryKey(),
    standards: text("standards").array(), // Quality standards array to match frontend
    title: varchar("title", { length: 255 }), // Frontend display title
    description: text("description"),
    icon: varchar("icon", { length: 100 }), // Icon for quality standard display
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    certificateId: integer("certificate_id"),
    category: varchar("category", { length: 100 }), // Quality standard category
    testingMethod: varchar("testing_method", { length: 255 }),
    frequency: varchar("frequency", { length: 100 }), // Testing frequency (e.g., "Every batch", "Monthly")
    checkpoints: jsonb("checkpoints").$type<string[]>(), // Quality control checkpoints
    criteria: jsonb("criteria").$type<Record<string, any>>(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("manufacturing_qualities_is_active_idx").on(table.isActive),
    index("manufacturing_qualities_image_id_idx").on(table.imageId),
    index("manufacturing_qualities_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Hero
export const technologyHero = pgTable(
  "technology_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    primaryButtonText: varchar("primary_button_text", { length: 100 }),
    primaryButtonLink: varchar("primary_button_link", { length: 255 }),
    secondaryButtonText: varchar("secondary_button_text", { length: 100 }),
    secondaryButtonLink: varchar("secondary_button_link", { length: 255 }),
    backgroundMediaId: integer("background_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // Preserve existing database column
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("technology_hero_is_active_idx").on(table.isActive),
    index("technology_hero_image_id_idx").on(table.imageId),
    index("technology_hero_video_id_idx").on(table.videoId),
    index("technology_hero_background_media_id_idx").on(table.backgroundMediaId),
  ],
);

// Technology Innovations
export const technologyInnovations = pgTable(
  "technology_innovations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    shortDescription: text("short_description"),
    iconName: varchar("icon_name", { length: 100 }),
    status: varchar("status", { length: 50 }).default("Active"),
    technicalDetails: jsonb("technical_details").$type<Record<string, any>>(),
    relatedProducts: jsonb("related_products").$type<string[]>(),
    benefits: jsonb("benefits").$type<string[]>(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    developmentYear: varchar("development_year", { length: 10 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("technology_innovations_is_active_idx").on(table.isActive),
    index("technology_innovations_image_id_idx").on(table.imageId),
    index("technology_innovations_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Equipment
export const technologyEquipment = pgTable(
  "technology_equipment",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 255 }),
    model: varchar("model", { length: 255 }),
    category: varchar("category", { length: 100 }),
    quantity: integer("quantity").default(1),
    capacity: varchar("capacity", { length: 255 }),
    maintenanceSchedule: varchar("maintenance_schedule", { length: 255 }),
    certifications: jsonb("certifications").$type<string[]>(),
    description: text("description"),
    specifications: jsonb("specifications").$type<Record<string, any>>(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    installationDate: timestamp("installation_date", {
      mode: "date",
      precision: 3,
    }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("technology_equipment_is_active_idx").on(table.isActive),
    index("technology_equipment_image_id_idx").on(table.imageId),
    index("technology_equipment_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Research
export const technologyResearch = pgTable(
  "technology_research",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    researchArea: varchar("research_area", { length: 255 }),
    status: varchar("status", { length: 50 }).default("ongoing"),
    startDate: timestamp("start_date", { mode: "date", precision: 3 }),
    expectedCompletion: timestamp("expected_completion", {
      mode: "date",
      precision: 3,
    }),
    teamMembers: jsonb("team_members").$type<string[]>(),
    objectives: jsonb("objectives").$type<string[]>(),
    partners: jsonb("partners").$type<string[]>(),
    currentProjects:
      jsonb("current_projects").$type<Array<{ name: string; status: string; progress: number }>>(),
    publications: jsonb("publications").$type<string[]>(),
    outcomes: jsonb("outcomes").$type<string[]>(),
    funding: decimal("funding", { precision: 12, scale: 2 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("technology_research_is_active_idx").on(table.isActive),
    index("technology_research_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Roadmap
export const technologyRoadmap = pgTable(
  "technology_roadmap",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    timeline: varchar("timeline", { length: 255 }),
    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
    status: varchar("status", { length: 50 }).default("planned"),
    priority: varchar("priority", { length: 20 }).default("medium"),
    milestones: jsonb("milestones").$type<Record<string, any>>(),
    impact: jsonb("impact").$type<string[]>(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("technology_roadmap_is_active_idx").on(table.isActive),
    index("technology_roadmap_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Gradient Settings
export const technologyGradientSettings = pgTable(
  "technology_gradient_settings",
  {
    id: serial("id").primaryKey(),
    gradientType: varchar("gradient_type", { length: 100 }).notNull(),
    colors: jsonb("colors").$type<string[]>(),
    direction: varchar("direction", { length: 50 }).default("to-right"),
    opacity: decimal("opacity", { precision: 3, scale: 2 }).default("1.0"),
    settings: jsonb("settings").$type<Record<string, any>>(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [index("technology_gradient_settings_is_active_idx").on(table.isActive)],
);

// Technology CTA Section
export const technologyCta = pgTable(
  "technology_cta",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    benefits: jsonb("benefits").$type<string[]>(),
    backgroundColor: varchar("background_color", { length: 20 }),
    textColor: varchar("text_color", { length: 20 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [index("technology_cta_is_active_idx").on(table.isActive)],
);

// Navigation Glassmorphism Settings
export const navigationGlassmorphismSettings = pgTable("navigation_glassmorphism_settings", {
  id: serial("id").primaryKey(),
  opacity: decimal("opacity", { precision: 3, scale: 2 }).default("0.8"),
  blur: integer("blur").default(10),
  borderRadius: integer("border_radius").default(12),
  backdropFilter: varchar("backdrop_filter", { length: 100 }).default("blur(10px)"),
  backgroundColor: varchar("background_color", { length: 20 }).default("rgba(255,255,255,0.1)"),
  borderColor: varchar("border_color", { length: 20 }).default("rgba(255,255,255,0.2)"),

  // Admin UI Advanced Glassmorphism Controls
  backgroundOpacity: decimal("background_opacity", {
    precision: 3,
    scale: 2,
  }).default("0.8"),
  blurStrength: integer("blur_strength").default(10),
  borderOpacity: decimal("border_opacity", {
    precision: 3,
    scale: 2,
  }).default("0.2"),
  shadowIntensity: decimal("shadow_intensity", {
    precision: 3,
    scale: 2,
  }).default("0.1"),
  topHighlightOpacity: decimal("top_highlight_opacity", {
    precision: 3,
    scale: 2,
  }).default("0.5"),
  leftHighlightOpacity: decimal("left_highlight_opacity", {
    precision: 3,
    scale: 2,
  }).default("0.3"),
  innerShadowOpacity: decimal("inner_shadow_opacity", {
    precision: 3,
    scale: 2,
  }).default("0.5"), // Inner shadow opacity for glassmorphism
  enabled: boolean("enabled").default(true), // Frontend toggle for glassmorphism effects

  settings: jsonb("settings").$type<Record<string, any>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// =============================================================================
// ADMIN & CONFIGURATION ENTITIES
// =============================================================================

// Certificates
export const certificates = pgTable(
  "certificates",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).default("sustainability"), // Categorical: sustainability, compliance, quality, safety, environmental
    issuingOrganization: varchar("issuing_organization", { length: 255 }),
    description: text("description"),
    certificateNumber: varchar("certificate_number", { length: 100 }),
    issueDate: timestamp("issue_date", { mode: "date", precision: 3 }),
    expiryDate: timestamp("expiry_date", { mode: "date", precision: 3 }),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    documentId: integer("document_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Frontend compatibility: URL and naming aliases
    issuingBody: varchar("issuing_body", { length: 255 }), // Alias for issuingOrganization
    documentUrl: varchar("document_url", { length: 500 }), // URL alias for documentId
    imageUrl: varchar("image_url", { length: 500 }), // URL alias for imageId

    status: varchar("status", { length: 50 }).default("active"),
    showOnSustainabilityPage: boolean("show_on_sustainability_page").default(false), // Missing property causing errors
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for certificate queries
    index("certificates_show_on_sustainability_idx").on(table.showOnSustainabilityPage),
    index("certificates_is_active_idx").on(table.isActive),
  ],
);

// Size Charts
export const sizeCharts = pgTable(
  "size_charts",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"), // Chart description for admin UI
    category: varchar("category", { length: 100 }),
    gender: varchar("gender", { length: 20 }),
    type: varchar("type", { length: 100 }), // Frontend expects chart type
    region: varchar("region", { length: 100 }), // Regional sizing standards (US, EU, UK, etc.)
    measurements: jsonb("measurements").$type<Record<string, any>>(),
    sizeRange: jsonb("size_range").$type<string[]>(),
    unit: varchar("unit", { length: 10 }).default("cm"),
    fitNotes: text("fit_notes"), // Fit guidance and notes
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for size chart queries
    index("size_charts_is_active_idx").on(table.isActive),
    index("size_charts_deleted_at_idx").on(table.deletedAt),
    index("size_charts_active_query_idx").on(table.isActive, table.deletedAt),
  ],
);

// Accessories
export const accessories = pgTable(
  "accessories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    type: varchar("type", { length: 100 }), // Frontend expects accessory type
    material: varchar("material", { length: 255 }),
    color: varchar("color", { length: 100 }),
    size: varchar("size", { length: 100 }),
    sku: varchar("sku", { length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    specifications: jsonb("specifications").$type<Record<string, any>>(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for accessory queries
    index("accessories_sku_idx").on(table.sku),
    index("accessories_is_active_idx").on(table.isActive),
  ],
);

// Folders
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  path: varchar("path", { length: 500 }),
  level: integer("level").default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),

  // Soft delete support
  deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
});

// Navigation Items - Enhanced for floating dock navigation
export const navigationItems = pgTable("navigation_items", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }), // Alias for label (frontend compatibility)
  title: varchar("title", { length: 255 }), // Frontend display title (alias for label)
  url: varchar("url", { length: 255 }),
  href: varchar("href", { length: 255 }), // Alias for url (frontend compatibility)
  path: varchar("path", { length: 255 }), // Path alias (frontend compatibility)
  iconName: varchar("icon_name", { length: 100 }),

  // Enhanced icon system (optional future expansion)
  iconType: varchar("icon_type", { length: 20 }).default("fallback"), // 'media' | 'fallback'
  iconSize: varchar("icon_size", { length: 20 }).default("medium"), // 'small' | 'medium' | 'large'
  fallbackIcon: varchar("fallback_icon", { length: 100 }).default("IconHome"), // Tabler icon name
  mediaIconId: integer("media_icon_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),

  // Hierarchical navigation
  parentId: integer("parent_id"),
  level: integer("level").default(0),

  // Display settings
  showOnDesktop: boolean("show_on_desktop").default(true),
  showOnMobile: boolean("show_on_mobile").default(true),

  // Behavior settings
  isExternal: boolean("is_external").default(false),
  target: varchar("target", { length: 20 }).default("_self"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),

  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),

  // Soft delete support
  deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
});

// Contact Page Configuration
export const contactPageConfigurations = pgTable("contact_page_configurations", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  heroTitle: varchar("hero_title", { length: 255 }), // Frontend expects heroTitle
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  workingHours: text("working_hours"),
  mapCoordinates: jsonb("map_coordinates").$type<{
    lat: number;
    lng: number;
  }>(),
  socialLinks: jsonb("social_links").$type<Record<string, string>>(),

  // New Contact Page Fields for Enhanced UI
  locationLine1: text("location_line1"),
  locationLine2: text("location_line2"),
  locationButtonText: varchar("location_button_text", {
    length: 100,
  }).default("GET DIRECTIONS"),
  tradingHours: jsonb("trading_hours").$type<Array<{ label: string; value: string }>>(),
  platformOptions: jsonb("platform_options")
    .$type<string[]>()
    .default(sql`'["Phone Call", "WhatsApp", "WeChat", "Telegram", "Other"]'::jsonb`),
  formButtonText: varchar("form_button_text", { length: 255 }).default(
    "Get a Response Within 24 Hours",
  ),
  formPrivacyText: text("form_privacy_text").default(
    "We value your privacy and will never share your information.",
  ),
  successHeading: varchar("success_heading", { length: 255 }).default("Thank you!"),
  successMessage: text("success_message").default(
    "We've received your message and will be in touch shortly.",
  ),

  // Admin UI Control Fields - Contact Page Settings
  contactInfoTitle: varchar("contact_info_title", { length: 255 }),
  contactInfoSubtitle: text("contact_info_subtitle"),
  showContactInfo: boolean("show_contact_info").default(true),
  showBusinessHours: boolean("show_business_hours").default(true),
  showLocationMap: boolean("show_location_map").default(true),
  heroBackgroundStyle: varchar("hero_background_style", {
    length: 100,
  }).default("gradient"),
  heroBackgroundColor: varchar("hero_background_color", { length: 50 }),
  contactCardsLayout: varchar("contact_cards_layout", { length: 50 }).default("grid"),
  showFormInSeparateSection: boolean("show_form_in_separate_section").default(false),
  formBackgroundStyle: varchar("form_background_style", {
    length: 100,
  }).default("default"),
  metaTitle: varchar("meta_title", { length: 255 }),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Contact Inquiries - Customer inquiry/contact form submissions
export const inquiries = pgTable(
  "inquiries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    // Contact information
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    company: varchar("company", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    country: varchar("country", { length: 100 }),

    // Form data
    preferredPlatform: varchar("preferred_platform", { length: 50 }),
    message: text("message").notNull(),

    // Metadata
    source: varchar("source", { length: 50 }).default("contact-page").notNull(),
    status: varchar("status", { length: 20 }).default("new").notNull(),

    // Timestamps
    submittedAt: timestamp("submitted_at", { mode: "date", precision: 3 }).defaultNow().notNull(),
    respondedAt: timestamp("responded_at", { mode: "date", precision: 3 }),

    // Admin fields
    adminNotes: text("admin_notes"),
    assignedTo: varchar("assigned_to", { length: 100 }),
  },
  (table) => [
    // Performance indexes
    index("inquiries_status_idx").on(table.status),
    index("inquiries_submitted_at_idx").on(table.submittedAt.desc()),
    index("inquiries_email_idx").on(table.email),
    index("inquiries_source_idx").on(table.source),
    // Composite index for admin filtering (status + submittedAt)
    index("inquiries_status_submitted_idx").on(table.status, table.submittedAt.desc()),
  ],
);

export const insertInquirySchema = createInsertSchema(inquiries);

// ============================================================================
// FOOTER CONFIGURATION (Restored & Standardized Phase 4)
// ============================================================================
// Single source of truth for footer settings
// ============================================================================

export const footerConfiguration = pgTable("footer_configuration", {
  id: serial("id").primaryKey(),

  // General Settings
  contactFormHeading: varchar("contact_form_heading", { length: 500 })
    .default("GET IN TOUCH WITH RUN APPAREL")
    .notNull(),
  contactFormEnabled: boolean("contact_form_enabled").default(true).notNull(),

  // Navigation & Links
  navigationColumns: jsonb("navigation_columns")
    .$type<
      Array<{
        title: string;
        links: Array<{ label: string; href: string; external?: boolean }>;
      }>
    >()
    .notNull()
    .default(sql`'[]'::jsonb`),

  socialLinks: jsonb("social_links")
    .$type<
      Array<{
        name: string;
        icon: string;
        href: string;
        hoverColor: string;
      }>
    >()
    .notNull()
    .default(sql`'[]'::jsonb`),

  legalLinks: jsonb("legal_links")
    .$type<Array<{ label: string; href: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),

  // Certificates
  certificateIds: jsonb("certificate_ids")
    .$type<number[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),

  // Company Info
  companyName: varchar("company_name", { length: 255 }).notNull().default(""),
  companyAddress: text("company_address").notNull().default(""),
  companyPhone: varchar("company_phone", { length: 50 }).notNull().default(""),
  companyEmail: varchar("company_email", { length: 255 }).notNull().default(""),

  // Branding
  brandText: varchar("brand_text", { length: 255 }).notNull().default(""),
  brandTagline: varchar("brand_tagline", { length: 255 }).notNull().default(""),
  brandSubtext: varchar("brand_subtext", { length: 255 }).notNull().default(""),

  // SEO
  structuredData: jsonb("structured_data").$type<Record<string, any>>(),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Zod Schemas for Footer Configuration
export const insertFooterConfigurationSchema = createInsertSchema(footerConfiguration, {
  navigationColumns: (schema) => schema.nullable(),
  socialLinks: (schema) => schema.nullable(),
  legalLinks: (schema) => schema.nullable(),
  certificateIds: (schema) => schema.nullable(),
  structuredData: (schema) => schema.nullable(),
  isActive: (schema) => schema.default(true),
});

// =============================================================================
// ENTERPRISE FEATURES: AUDIT TRAIL SYSTEM (Phase 2.2)
// =============================================================================

// Audit Logs for comprehensive change tracking
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),

  // Action details
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, RESTORE, SOFT_DELETE
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id", { length: 50 }).notNull(), // String to support various ID types

  // Change tracking
  oldValues: jsonb("old_values").$type<Record<string, any>>(), // Previous state
  newValues: jsonb("new_values").$type<Record<string, any>>(), // New state
  changedFields: jsonb("changed_fields").$type<string[]>(), // List of modified fields

  // User attribution
  userId: varchar("user_id", { length: 100 }), // User who made the change
  userEmail: varchar("user_email", { length: 255 }), // Email for tracking
  userRole: varchar("user_role", { length: 50 }), // Role at time of change

  // Request context
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6 support
  userAgent: text("user_agent"), // Browser/client information
  sessionId: varchar("session_id", { length: 255 }), // Session tracking

  // Additional metadata
  reason: text("reason"), // Optional reason for change
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional context

  // Timestamps
  timestamp: timestamp("timestamp", { mode: "date", precision: 3 }).defaultNow().notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(), // Additional timestamp for compatibility

  // Enterprise features
  complianceLevel: varchar("compliance_level", { length: 50 }).default("standard"), // standard, high, critical
  retentionPeriod: integer("retention_period").default(2555), // Days to retain (7 years default)
});

// Audit Configuration for system-wide audit settings
export const auditConfiguration = pgTable("audit_configuration", {
  id: serial("id").primaryKey(),

  // Global audit settings
  enabled: boolean("enabled").default(true),
  trackAllTables: boolean("track_all_tables").default(false),
  trackedTables: jsonb("tracked_tables").$type<string[]>(), // Specific tables to audit

  // Retention policies
  defaultRetentionDays: integer("default_retention_days").default(2555), // 7 years
  highComplianceRetentionDays: integer("high_compliance_retention_days").default(3650), // 10 years
  criticalComplianceRetentionDays: integer("critical_compliance_retention_days").default(7300), // 20 years

  // Performance settings
  batchSize: integer("batch_size").default(100),
  asyncProcessing: boolean("async_processing").default(true),

  // Privacy settings
  excludeSensitiveFields: jsonb("exclude_sensitive_fields").$type<string[]>(),
  encryptPayloads: boolean("encrypt_payloads").default(false),

  // Notification settings
  alertOnCriticalChanges: boolean("alert_on_critical_changes").default(true),
  alertThreshold: integer("alert_threshold").default(100), // Number of changes per hour

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// =============================================================================
// SYSTEM & PERFORMANCE ENTITIES
// =============================================================================

// Performance Metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type", { length: 100 }).notNull(),
  componentName: varchar("component_name", { length: 255 }).notNull(),
  component: varchar("component", { length: 255 }), // Additional component field for compatibility
  value: decimal("value", { precision: 12, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Animation Errors
export const animationErrors = pgTable("animation_errors", {
  id: serial("id").primaryKey(),
  errorType: varchar("error_type", { length: 100 }).notNull(),
  message: text("message").notNull(),
  stackTrace: text("stack_trace"),
  componentName: varchar("component_name", { length: 255 }),
  url: varchar("url", { length: 500 }),
  userAgent: varchar("user_agent", { length: 500 }),
  retryCount: integer("retry_count").default(0),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at", { mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Logo Animation Settings
export const logoAnimationSettings = pgTable("logo_animation_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  duration: integer("duration").default(2000),
  delay: integer("delay").default(0),
  easing: varchar("easing", { length: 100 }).default("ease-out"),
  scale: decimal("scale", { precision: 4, scale: 2 }).default("1.0"),
  rotation: integer("rotation").default(0),
  opacity: decimal("opacity", { precision: 3, scale: 2 }).default("1.0"),
  motionEnabled: boolean("motion_enabled").default(true), // Enable/disable motion animations
  motionSpeed: decimal("motion_speed", { precision: 3, scale: 2 }), // Animation speed multiplier
  motionElements: jsonb("motion_elements").$type<string[]>(), // Elements with motion applied
  animationDurationMultiplier: decimal("animation_duration_multiplier", {
    precision: 3,
    scale: 2,
  }).default("1.0"), // Duration multiplier
  drawStagger: decimal("draw_stagger", { precision: 4, scale: 2 }), // Stagger delay between elements
  drawEasing: varchar("draw_easing", { length: 100 }), // Draw animation easing
  skipButtonEnabled: boolean("skip_button_enabled").default(false), // Show skip button
  showFrequency: boolean("show_frequency").default(false), // Show frequency indicator
  customCssClass: varchar("custom_css_class", { length: 255 }), // Custom CSS class
  debugMode: boolean("debug_mode").default(false), // Debug mode for animation
  settings: jsonb("settings").$type<Record<string, any>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Storage Analysis Results
export const storageAnalysisResults = pgTable("storage_analysis_results", {
  id: serial("id").primaryKey(),
  timestamp: varchar("timestamp", { length: 50 }).notNull(),
  totalFiles: integer("total_files").notNull(),
  totalSize: integer("total_size").notNull(),
  referencedFiles: integer("referenced_files").notNull(),
  orphanedCount: integer("orphaned_count").notNull(),
  duplicateGroups: integer("duplicate_groups").notNull(),
  compressionCandidates: integer("compression_candidates").notNull(),
  potentialSavings: jsonb("potential_savings").$type<{
    orphanedSize: number;
    duplicateSize: number;
    compressionSize: number;
    totalSavings: number;
  }>(),
  analysisTime: integer("analysis_time").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Storage Change Logs
export const storageChangeLogs = pgTable("storage_change_logs", {
  id: serial("id").primaryKey(),
  timestamp: varchar("timestamp", { length: 50 }).notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  mediaId: integer("media_id").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  size: integer("size"),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Additional entities from research (unified sustainability, features, etc.)
export const sustainabilityFeatures = pgTable("sustainability_features", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  impact: text("impact"),
  imageId: integer("image_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  metrics: jsonb("metrics").$type<Record<string, any>>(),
  highlightedFeatures:
    jsonb("highlighted_features").$type<Array<{ title: string; description: string }>>(), // Key features to highlight
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

export const unifiedSustainability = pgTable("unified_sustainability", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  headline: varchar("headline", { length: 255 }), // Frontend display headline
  subheadline: text("subheadline"), // Frontend display subheadline
  content: text("content"),
  sectionType: varchar("section_type", { length: 100 }).notNull(),
  data: jsonb("data").$type<Record<string, any>>(),
  // REMOVED: metrics JSONB column (use sustainability_metrics table instead)
  ctaText: varchar("cta_text", { length: 100 }), // Call-to-action button text
  ctaLink: varchar("cta_link", { length: 255 }), // Call-to-action button link

  // Section-specific titles and descriptions
  metricsTitle: varchar("metrics_title", { length: 255 }),
  metricsDescription: text("metrics_description"),
  certificationsTitle: varchar("certifications_title", { length: 255 }),
  certificationsDescription: text("certifications_description"),
  certificationsFooterNote: text("certifications_footer_note"),
  certificationIds: jsonb("certification_ids").$type<number[]>(), // Array of certification IDs
  initiativesTitle: varchar("initiatives_title", { length: 255 }),
  initiativesDescription: text("initiatives_description"),
  goalsTitle: varchar("goals_title", { length: 255 }),
  goalsDescription: text("goals_description"),
  fabricPortfolioTitle: varchar("fabric_portfolio_title", { length: 255 }),
  fabricPortfolioDescription: text("fabric_portfolio_description"),
  featuresTitle: varchar("features_title", { length: 255 }),
  featuresDescription: text("features_description"),
  callToActionTitle: varchar("call_to_action_title", { length: 255 }),
  callToActionDescription: text("call_to_action_description"),
  callToActionButtonText: varchar("call_to_action_button_text", {
    length: 100,
  }),
  callToActionButtonLink: varchar("call_to_action_button_link", {
    length: 255,
  }),
  buttonText: varchar("button_text", { length: 100 }), // Generic button text
  buttonLink: varchar("button_link", { length: 255 }), // Generic button link
  backgroundImageId: integer("background_image_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }), // Background image

  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

export type UnifiedSustainability = typeof unifiedSustainability.$inferSelect;
export type InsertUnifiedSustainability = typeof unifiedSustainability.$inferInsert;

// insertHomepageSustainabilitySchema is already defined elsewhere, so we don't redefine it here.

// =============================================================================
// TYPE EXPORTS FOR COMPATIBILITY
// =============================================================================

// Schema unification complete - all types now defined in this file

// =============================================================================
// ZOD VALIDATION SCHEMAS (for API validation)
// =============================================================================

// Core entity schemas - simplified Zod schemas for API validation
export const insertCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1), // REQUIRED: matches database schema
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().nullable().optional(), // FIXED: Allow null values for no parent
  gridPosition: z.number().optional(), // ADDED: missing from schema
  featuredOnHomepage: z.boolean().optional(), // ADDED: missing from schema
  sortOrder: z.number().optional(), // ADDED: missing from schema
  primaryImageId: z.number().nullable().optional(), // CHUNK 10: Object Storage migration

  // SEO fields - align with database schema
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),

  // Image fields - align with database schema
  imageUrl: z.string().max(500).optional(),
  bannerUrl: z.string().max(500).optional(),

  // Display ordering - align with database schema
  displayOrder: z.number().optional(),

  // Featured content - nested structure matching CategoryForm and database JSONB
  featuredContent: z
    .object({
      card1: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
          maskSvgUrl: z.string().optional(),
          contentMediaUrl: z.string().optional(),
        })
        .optional(),
      card2: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
          expandedContent: z
            .array(
              z.object({
                title: z.string(),
                text: z.string(),
              }),
            )
            .optional(),
        })
        .optional(),
      card3: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
          subtitle: z.string().optional(),
          features: z.array(z.string()).optional(),
        })
        .optional(),
      card4: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const insertMediaAssetSchema = z.object({
  filename: z.string().min(1),
  originalName: z.string().optional(),
  type: z.string().min(1),
  mimeType: z.string().min(1), // REQUIRED: matches database NOT NULL constraint
  fileSize: z.number().optional(),
  url: z.string().optional(),
  // REQUIRED: Storage fields that are NOT NULL in database
  storagePath: z.string().min(1), // REQUIRED: matches database NOT NULL constraint
  bucketName: z.string().min(1), // REQUIRED: matches database NOT NULL constraint
  tags: z.array(z.string()).optional(),
});

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
  videos: z.array(z.record(z.string(), z.any())).optional(),

  // Business fields
  sku: z.string().min(1, "SKU is required"),

  // B2B specific
  minimumOrderQuantity: z.number().min(1).optional(),
  leadTime: z.string().optional(),

  // Product specifications
  specifications: z.array(z.string()).optional(),
  technicalSpecs: z.record(z.string(), z.any()).optional(),
  fiberComposition: z.record(z.string(), z.any()).optional(),
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

export const insertFabricSchema = z.object({
  // Basic Fields
  name: z.string().min(1),
  description: z.string().optional(),
  fabricType: z.string().optional(),

  // PRODUCT ESSENCE - B2B Core Fields
  sport: z.string().optional(),
  marketSegment: z.string().optional(),
  seasonality: z.string().optional(),

  weight: z.string().optional(),
  /**
   * @deprecated Use `compositions` array instead for structured fiber composition data
   * @since 2024-09 - Field removed from database schema, kept in Zod for backward compatibility
   * @remove 2026-03 - Will be removed after 6-month grace period with zero usage
   * @description Legacy string field for fabric composition. Server-side mapping converts this to compositions array.
   *              New integrations should use the structured `compositions` array field.
   */
  composition: z.string().optional(),
  weave: z.string().optional(),
  weaveType: z.string().optional(),
  weaveTypes: z.array(z.string()).optional(),
  stretch: z.string().optional(),
  finishTreatment: z.string().optional(),
  finish: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  careInstructions: z.string().optional(),
  sustainabilityScore: z.union([z.number().int(), z.string()]).optional(),
  certificateIds: z.array(z.number()).optional(),
  visualSwatchId: z.number().int().optional(),
  keyApplications: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),

  // Fiber Compositions (multiple compositions, each can be 100%)
  compositions: z
    .array(
      z.object({
        name: z.string(),
        isDefault: z.boolean(),
        fibers: z.array(
          z.object({
            fiberId: z.union([z.number(), z.null()]),
            percentage: z.string(),
          }),
        ),
      }),
    )
    .optional(),

  // Performance & Technical Fields
  stretchDirection: z.array(z.string()).optional(),
  stretchPercentage: z.string().optional(),
  breathability: z.string().optional(),
  moistureManagement: z.string().optional(),
  enhancedMoistureManagement: z.string().optional(),
  wickingRate: z.string().optional(),
  dryingTime: z.string().optional(),
  airPermeability: z.string().optional(),
  waterColumn: z.string().optional(),
  performanceFeatures: z.array(z.string()).optional(),

  // Durability & Quality Fields
  yarnCountConstruction: z.string().optional(),
  colorfastness: z.string().optional(), // NEW: Color fastness rating
  tensileStrength: z.string().optional(), // NEW: Tensile strength measurement
  tearStrength: z.string().optional(), // NEW: Tear strength measurement
  abrasionResistance: z.string().optional(),
  pillingGrade: z.string().optional(),
  shrinkageTolerancePercentage: z.string().optional(),
  washTemperature: z.string().optional(),

  // Sustainability & Lifecycle Fields
  certificationTags: z.array(z.number()).optional(),
  certificationIds: z.array(z.number()).optional(),
  endOfLifeOptions: z.array(z.string()).optional(),
  recyclabilityNotes: z.string().optional(),

  // Use Cases & Applications
  useCases: z.array(z.string()).optional(),
  finishTreatments: z.array(z.string()).optional(),

  // Care Instructions (structured)
  washCareInstructions: z
    .object({
      careSymbols: z.array(z.string()).optional(),
      instructions: z.string().optional(),
      restrictions: z.array(z.string()).optional(),
    })
    .optional(),
});

export const insertFiberSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1), // REQUIRED: matches database schema
  description: z.string().optional(),
  sustainabilityScore: z.number().int().optional(),
  environmentalImpact: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

export const insertCertificateSchema = z.object({
  name: z.string().min(1),
  type: z.string().nullable().optional(),
  issuingOrganization: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  certificateNumber: z.string().nullable().optional(),
  issueDate: z.date().or(z.string()).nullable().optional(),
  expiryDate: z.date().or(z.string()).nullable().optional(),
  imageId: z.number().int().nullable().optional(),
  documentId: z.number().int().nullable().optional(),
  issuingBody: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const insertSizeChartSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  type: z.string().optional(),
  region: z.string().optional(),
  measurements: z.record(z.string(), z.any()).optional(),
  sizeRange: z.array(z.string()).optional(),
  unit: z.string().optional(),
  fitNotes: z.string().optional(),
  imageId: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const insertAccessorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().or(z.string()).optional(),
  imageId: z.number().int().optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

export const insertFolderSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.number().int().positive().optional().nullable(),
});

// Content management schemas - simplified for API validation
export const insertHomepageHeroSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  backgroundImageId: z.number().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  ctaLink: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const insertHomepageSloganSchema = z.object({
  text: z.string().min(1),
  position: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(), // Accept both, convert to string
  fontSize: z.string().optional(),
  color: z.string().optional(),
  animationType: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const insertHomepageProcessCardSchema = z.object({
  title: z.string().min(1),
  step: z.number().int().positive(),
  description: z.string().optional(),

  // Additional fields to match frontend expectations
  icon: z.string().optional(), // For text/emoji icons
  iconMediaId: z.number().nullable().optional(), // For image icons - accepts null
  iconType: z.enum(["text", "image"]).nullable().optional(), // Icon type selector - accepts null
  category: z.string().optional(), // Process category
  position: z.number().optional(), // Position/order

  isActive: z.boolean().optional(),
});

export const insertHomepageSectionSchema = z.object({
  sectionName: z.string().min(1),
  content: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertHomepageSustainabilitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),

  // Additional fields to match frontend expectations
  highlightedFeatures: z.array(z.string()).optional(),
  statistics: z
    .object({
      recycledMaterials: z.number(),
      carbonReduction: z.number(),
      renewableEnergy: z.number(),
      waterSaved: z.number(),
    })
    .optional(),
  impactMetrics: z
    .object({
      waterSavedPerProduct: z.number(),
      co2ReducedPerProduct: z.number(),
      wastePreventedPerProduct: z.number(),
    })
    .optional(),
  certificationIds: z.array(z.number()).optional(),

  isActive: z.boolean().optional(),
});

export const insertHomepageFeaturedProductsSettingsSchema = z.object({
  title: z.string().optional(),
  maxProducts: z.number().optional(),
  autoSelect: z.boolean().optional(),
  selectedProductIds: z.array(z.number()).optional(),
  sortBy: z.string().optional(),
  isActive: z.boolean().optional(),

  // Animation Settings Validation - Phase 4 Schema Alignment
  isEnabled: z.boolean().optional(),
  dotGrid: z
    .object({
      dotSize: z.number().min(1).max(50),
      gap: z.number().min(1).max(100),
      baseColor: z.string(),
      activeColor: z.string(),
      proximity: z.number().min(50).max(300),
      shockRadius: z.number().min(100).max(500),
      shockStrength: z.number().min(1).max(10),
      resistance: z.number().min(100).max(1000),
      returnDuration: z.number().min(0.1).max(5),
    })
    .optional(),
  liquidGlass: z
    .object({
      blur: z.number().min(0).max(20),
      opacity: z.number().min(0).max(100),
      borderOpacity: z.number().min(0).max(100),
      cardHoverScale: z.number().min(1).max(1.5),
    })
    .optional(),
  swipeAnimation: z
    .object({
      transitionDuration: z.number().min(0.1).max(2),
      easing: z.enum([
        "ease-out",
        "ease-in",
        "ease-in-out",
        "ease",
        "linear",
        "easeIn",
        "easeOut",
        "easeInOut",
      ]),
    })
    .optional(),
});

// About page schemas
export const insertAboutHeroSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  imageId: z.number().optional(),
  videoId: z.number().optional(),
  backgroundMediaId: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertAboutTimelineEntrySchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  imageId: z.number().optional(),
});

export const insertAboutMapLocationSchema = z.object({
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().optional(),
  address: z.string().optional(),
  locationType: z.string().optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  details: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertAboutSectionSchema = z.object({
  title: z.string().min(1),
  sectionType: z.string().min(1),
  content: z.string().optional(),
  imageId: z.number().optional(),
  mediaIds: z.array(z.number()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const insertAboutStatisticSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
  description: z.string().optional(),
  iconName: z.string().optional(),
  icon: z.string().optional(),
  position: z.number().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const insertAboutTeamMessageSchema = z.object({
  name: z.string().optional(),
  position: z.string().nullable().optional(),
  message: z.string().min(1),
  title: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  imageId: z.number().optional(),
  isActive: z.boolean().optional(),
});

// Sustainability & Manufacturing schemas
export const insertSustainabilityHeroSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertSustainabilityMetricSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  iconName: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  currentValue: z.string().nullable().optional(),
  targetValue: z.string().nullable().optional(),
  targetYear: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return Number(val);
    }),
  sortOrder: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return Number(val);
    }),
  isActive: z.boolean().optional(),
});

export const insertSustainabilityInitiativeSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  impact: z.string().nullable().optional(),
  imageId: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return Number(val);
    }),
  iconName: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  startDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  targetDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  isActive: z.boolean().optional(),
  sortOrder: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return Number(val);
    }),
});

export const insertSustainabilityGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  target: z.string().nullable().optional(),
  currentProgress: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return String(val);
    }),
  currentValue: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return String(val);
    }),
  targetValue: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return String(val);
    }),
  targetYear: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return Number(val);
    }),
  unit: z.string().nullable().optional(),
  targetDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  category: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === ""))
        return null;
      return Number(val);
    }),
});

export const insertUnifiedSustainabilitySchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  sectionType: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const insertSustainabilityFeaturesSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertSustainabilityFabricPortfolioSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(), // Frontend expects title
  description: z.string().optional(),
  selectedFabricIds: z.array(z.number()).optional(), // Array of fabric IDs to display
  isActive: z.boolean().optional(),
});

export const insertSustainabilityCallToActionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  buttonText: z.string().optional(), // CTA button text
  buttonLink: z.string().optional(), // CTA button link
  isActive: z.boolean().optional(),
});

export const insertSustainabilitySectionHeadersSchema = z.object({
  section: z.string().min(1),
  title: z.string().min(1),
  metricsTitle: z.string().optional(),
  metricsDescription: z.string().optional(),
  certificationsTitle: z.string().optional(),
  certificationsDescription: z.string().optional(),
  certificationsFooterNote: z.string().optional(),
  initiativesTitle: z.string().optional(),
  initiativesDescription: z.string().optional(),
  goalsTitle: z.string().optional(),
  goalsDescription: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertManufacturingHeroSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  imageId: z.number().int().nullable().optional(),
  videoId: z.number().int().nullable().optional(),
  backgroundMediaId: z.number().int().nullable().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),

  // Bottom Call to Action Section
  bottomCtaTitle: z.string().optional(),
  bottomCtaDescription: z.string().optional(),
  bottomCtaText: z.string().optional(),
  bottomCtaLink: z.string().optional(),

  isActive: z.boolean().optional(),
});

export const insertManufacturingProcessSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  step: z.number().int().positive(),
  position: z.number().int().optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  efficiency: z.number().int().min(0).max(100).optional(),
  category: z.string().optional(),
  iconName: z.string().optional(),
  imageId: z.number().int().nullable().optional(),
  mediaIds: z.array(z.number().int()).optional(),
  equipment: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const insertManufacturingCapabilitySchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  capacity: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  imageId: z.number().nullable().optional(),
  equipment: z.array(z.string()).optional(),
  specifications: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export const insertManufacturingQualitySchema = z.object({
  standards: z.array(z.string()).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  imageId: z.number().nullable().optional(),
  category: z.string().optional(),
  testingMethod: z.string().optional(),
  frequency: z.string().optional(),
  checkpoints: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Technology schemas
export const insertTechnologyHeroSchema = createInsertSchema(technologyHero, {
  title: (schema) => schema.min(1, "Title is required").max(255),
  subtitle: (schema) => schema.nullable(),
  description: (schema) => schema.nullable(),
  primaryButtonText: (schema) => schema.max(100).nullable(),
  primaryButtonLink: (schema) => schema.max(255).nullable(),
  secondaryButtonText: (schema) => schema.max(100).nullable(),
  secondaryButtonLink: (schema) => schema.max(255).nullable(),
  backgroundMediaId: (schema) => schema.positive().nullable(),
  imageId: (schema) => schema.positive().nullable(),
  videoId: (schema) => schema.positive().nullable(),
  isActive: (schema) => schema.default(true),
});

export const insertTechnologyInnovationSchema = createInsertSchema(technologyInnovations, {
  name: (schema) => schema.min(1, "Innovation name is required").max(255),
  description: (schema) => schema.nullable(),
  shortDescription: (schema) => schema.nullable(),
  iconName: (schema) => schema.max(100).nullable(),
  status: (schema) => schema.max(50).default("Active"),
  technicalDetails: (schema) => schema.nullable(),
  relatedProducts: (schema) => schema.nullable(),
  category: (schema) => schema.max(100).nullable(),
  benefits: (schema) => schema.nullable(),
  imageId: (schema) => schema.positive().nullable(),
  developmentYear: (schema) => schema.max(10).nullable(),
  isActive: (schema) => schema.default(true),
  sortOrder: (schema) => schema.int().default(0),
});

export const insertTechnologyEquipmentSchema = createInsertSchema(technologyEquipment, {
  name: (schema) => schema.min(1, "Equipment name is required").max(255),
  manufacturer: (schema) => schema.max(255).nullable(),
  model: (schema) => schema.max(255).nullable(),
  category: (schema) => schema.max(100).nullable(),
  quantity: (schema) => schema.int().default(1),
  capacity: (schema) => schema.max(255).nullable(),
  maintenanceSchedule: (schema) => schema.max(255).nullable(),
  certifications: (schema) => schema.nullable(),
  description: (schema) => schema.nullable(),
  specifications: (schema) => schema.nullable(),
  imageId: (schema) => schema.positive().nullable(),
  installationDate: (schema) => schema.nullable(),
  isActive: (schema) => schema.default(true),
  sortOrder: (schema) => schema.int().default(0),
});

export const insertTechnologyResearchSchema = createInsertSchema(technologyResearch, {
  title: (schema) => schema.min(1, "Research title is required").max(255),
  description: (schema) => schema.nullable(),
  researchArea: (schema) => schema.max(255).nullable(),
  status: (schema) => schema.max(50).default("ongoing"),
  startDate: (schema) => schema.nullable(),
  expectedCompletion: (schema) => schema.nullable(),
  teamMembers: (schema) => schema.nullable(),
  objectives: (schema) => schema.nullable(),
  partners: (schema) => schema.nullable(),
  funding: (schema) => schema.nullable(),
  isActive: (schema) => schema.default(true),
  sortOrder: (schema) => schema.int().default(0),
});

export const insertTechnologyRoadmapSchema = createInsertSchema(technologyRoadmap, {
  title: (schema) => schema.min(1, "Roadmap item title is required").max(255),
  description: (schema) => schema.nullable(),
  targetDate: (schema) => schema.nullable(),
  status: (schema) => schema.max(50).default("planned"),
  priority: (schema) => schema.max(20).default("medium"),
  milestones: (schema) => schema.nullable(),
  isActive: (schema) => schema.default(true),
  sortOrder: (schema) => schema.int().default(0),
});

// Strict validation for Settings JSONB column (matches Frontend GradientFormData)
export const technologyGradientFrontendSchema = z.object({
  gradientColors: z.tuple([z.string(), z.string()]).default(["#FF9FFC", "#5227FF"]),
  angle: z.number().default(0),
  noise: z.number().default(0.3),
  blindCount: z.number().default(16),
  blindMinWidth: z.number().default(60),
  shineDirection: z.enum(["left", "right"]).default("right"),
  spotlightRadius: z.number().default(0.8),
  mouseDampening: z.number().default(0.1),
  distortAmount: z.number().default(0.1),
  paused: z.boolean().default(false),
  spotlightSoftness: z.number().default(1.8),
  spotlightOpacity: z.number().default(0.4),
  mirrorGradient: z.boolean().default(false),
  mixBlendMode: z.string().default("screen"),
  adminForceSettings: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const insertTechnologyGradientSettingsSchema = createInsertSchema(
  technologyGradientSettings,
  {
    gradientType: (schema) => schema.min(1, "Gradient type is required").max(100),
    colors: (schema) => schema.nullable(),
    direction: (schema) => schema.max(50).default("to-right"),
    opacity: (schema) => schema.nullable(),
    settings: () => technologyGradientFrontendSchema.nullable(),
    isActive: (schema) => schema.default(true),
  },
);

export const insertTechnologyCtaSchema = createInsertSchema(technologyCta, {
  title: (schema) => schema.min(1, "CTA title is required").max(255),
  content: (schema) => schema.nullable(),
  ctaText: (schema) => schema.max(100).nullable(),
  ctaLink: (schema) => schema.max(255).nullable(),
  backgroundColor: (schema) => schema.max(20).nullable(),
  textColor: (schema) => schema.max(20).nullable(),
  isActive: (schema) => schema.default(true),
});

// Navigation & UI schemas
export const insertNavigationItemSchema = z.object({
  // PRIMARY FIELDS: Frontend MUST use these fields (required)
  title: z.string().min(1),
  href: z.string().min(1),

  // Icon configuration
  iconType: z.enum(["media", "fallback"]).optional(),
  iconSize: z.enum(["small", "medium", "large"]).optional(),
  fallbackIcon: z.string().optional(),
  mediaIconId: z.number().nullable().optional(),

  // Display and ordering
  showOnDesktop: z.boolean().optional(),
  showOnMobile: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),

  // LEGACY FIELDS: DO NOT USE in frontend forms
  // These exist only for database compatibility - backend maps title→label, href→url
  label: z.string().optional(),
  url: z.string().optional(),
});

export const insertNavigationGlassmorphismSettingsSchema = z.object({
  opacity: z.number().optional(),
  blur: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertContactPageConfigurationSchema = z.object({
  title: z.string().optional(),
  heroTitle: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  workingHours: z.string().optional(),
  mapCoordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),

  // New Contact Page Fields for Enhanced UI
  locationLine1: z.string().optional(),
  locationLine2: z.string().optional(),
  locationButtonText: z.string().optional(),
  tradingHours: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  platformOptions: z.array(z.string()).optional(),
  formButtonText: z.string().optional(),
  formPrivacyText: z.string().optional(),
  successHeading: z.string().optional(),
  successMessage: z.string().optional(),

  isActive: z.boolean().optional(),
});

export const insertLogoAnimationSettingsSchema = z.object({
  animationType: z.string().min(1),
  duration: z.number().optional(),
  isActive: z.boolean().optional(),
});

// System & Performance schemas
export const insertAnimationErrorSchema = z.object({
  component: z.string().min(1),
  error: z.string().min(1),
  timestamp: z.string().optional(),
});

export const insertPerformanceMetricSchema = z.object({
  metric: z.string().min(1),
  value: z.number(),
  timestamp: z.string().optional(),
});

// Additional Drizzle inferred types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;

// Optimized MediaAsset types for efficient queries (matches backend column selections)
export type MediaAssetSummary = Pick<
  MediaAsset,
  | "id"
  | "filename"
  | "type"
  | "mimeType"
  | "url"
  | "thumbnailUrl"
  | "fileSize"
  | "createdAt"
  | "originalName"
  | "size"
  | "folderId"
  | "tags"
  | "altText"
  | "caption"
  | "metadata"
  | "isActive"
>;

export type MediaAssetDetail = Pick<
  MediaAsset,
  | "id"
  | "filename"
  | "originalName"
  | "fileSize"
  | "size"
  | "mimeType"
  | "type"
  | "url"
  | "thumbnailUrl"
  | "thumbnailFilename"
  | "imageVariants"
  | "storagePath"
  | "bucketName"
  | "folderId"
  | "tags"
  | "altText"
  | "caption"
  | "metadata"
  | "isActive"
  | "deletedAt"
  | "createdAt"
  | "updatedAt"
  | "uploadedAt"
>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export const selectProductSchema = createSelectSchema(products);
export const selectCategorySchema = createSelectSchema(categories);

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

export type Fabric = typeof fabrics.$inferSelect;
export type InsertFabric = typeof fabrics.$inferInsert;

export type Fiber = typeof fibers.$inferSelect;
export type InsertFiber = typeof fibers.$inferInsert;

// Content Management Types
export type HomepageHero = typeof homepageHero.$inferSelect;
export type InsertHomepageHero = typeof homepageHero.$inferInsert;

export type HomepageSlogan = typeof homepageSlogans.$inferSelect;
export type InsertHomepageSlogan = typeof homepageSlogans.$inferInsert;

export type HomepageProcessCard = typeof homepageProcessCards.$inferSelect;
export type InsertHomepageProcessCard = typeof homepageProcessCards.$inferInsert;

export type HomepageSection = typeof homepageSections.$inferSelect;
export type InsertHomepageSection = typeof homepageSections.$inferInsert;

export type HomepageFeaturedProductsSettings = typeof homepageFeaturedProductsSettings.$inferSelect;
export type InsertHomepageFeaturedProductsSettings =
  typeof homepageFeaturedProductsSettings.$inferInsert;

export type AboutHero = typeof aboutHero.$inferSelect;
export type InsertAboutHero = typeof aboutHero.$inferInsert;

export type AboutTimelineEntry = typeof aboutTimelineEntries.$inferSelect;
export type InsertAboutTimelineEntry = typeof aboutTimelineEntries.$inferInsert;

export type AboutMapLocation = typeof aboutMapLocations.$inferSelect;
export type InsertAboutMapLocation = typeof aboutMapLocations.$inferInsert;

export type AboutSection = typeof aboutSections.$inferSelect;
export type InsertAboutSection = typeof aboutSections.$inferInsert;

export type AboutStatistic = typeof aboutStatistics.$inferSelect;
export type InsertAboutStatistic = typeof aboutStatistics.$inferInsert;

export type AboutTeamMessage = typeof aboutTeamMessages.$inferSelect;
export type InsertAboutTeamMessage = typeof aboutTeamMessages.$inferInsert;

// Sustainability & Manufacturing Types
export type SustainabilityHero = typeof sustainabilityHero.$inferSelect;
export type InsertSustainabilityHero = typeof sustainabilityHero.$inferInsert;

export type SustainabilityMetric = typeof sustainabilityMetrics.$inferSelect;
export type InsertSustainabilityMetric = typeof sustainabilityMetrics.$inferInsert;

export type SustainabilityInitiative = typeof sustainabilityInitiatives.$inferSelect;
export type InsertSustainabilityInitiative = typeof sustainabilityInitiatives.$inferInsert;

export type SustainabilityGoal = typeof sustainabilityGoals.$inferSelect;
export type InsertSustainabilityGoal = typeof sustainabilityGoals.$inferInsert;

export type ManufacturingHero = typeof manufacturingHero.$inferSelect;
export type InsertManufacturingHero = typeof manufacturingHero.$inferInsert;

export type ManufacturingProcess = typeof manufacturingProcesses.$inferSelect;
export type InsertManufacturingProcess = typeof manufacturingProcesses.$inferInsert;

export type ManufacturingCapability = typeof manufacturingCapabilities.$inferSelect;
export type InsertManufacturingCapability = typeof manufacturingCapabilities.$inferInsert;

export type ManufacturingQuality = typeof manufacturingQualities.$inferSelect;
export type InsertManufacturingQuality = typeof manufacturingQualities.$inferInsert;

export type TechnologyHero = typeof technologyHero.$inferSelect;
export type InsertTechnologyHero = typeof technologyHero.$inferInsert;

export type TechnologyInnovation = typeof technologyInnovations.$inferSelect;
export type InsertTechnologyInnovation = typeof technologyInnovations.$inferInsert;

export type TechnologyEquipment = typeof technologyEquipment.$inferSelect;
export type InsertTechnologyEquipment = typeof technologyEquipment.$inferInsert;

export type TechnologyResearch = typeof technologyResearch.$inferSelect;
export type InsertTechnologyResearch = typeof technologyResearch.$inferInsert;

// Admin & Configuration Types
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

export type SizeChart = typeof sizeCharts.$inferSelect;
export type InsertSizeChart = typeof sizeCharts.$inferInsert;

export type Accessory = typeof accessories.$inferSelect;
export type InsertAccessory = typeof accessories.$inferInsert;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

export type NavigationItem = typeof navigationItems.$inferSelect;
export type InsertNavigationItem = typeof navigationItems.$inferInsert;

export type ContactPageConfiguration = typeof contactPageConfigurations.$inferSelect;
export type InsertContactPageConfiguration = typeof contactPageConfigurations.$inferInsert;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

export type FooterConfiguration = typeof footerConfiguration.$inferSelect;
export type InsertFooterConfiguration = typeof footerConfiguration.$inferInsert;

// System & Performance Types
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

export type AnimationError = typeof animationErrors.$inferSelect;
export type InsertAnimationError = typeof animationErrors.$inferInsert;

export type LogoAnimationSettings = typeof logoAnimationSettings.$inferSelect;
export type InsertLogoAnimationSettings = typeof logoAnimationSettings.$inferInsert;

export type StorageAnalysisResult = typeof storageAnalysisResults.$inferSelect;
export type InsertStorageAnalysisResult = typeof storageAnalysisResults.$inferInsert;

export type StorageChangeLog = typeof storageChangeLogs.$inferSelect;
export type InsertStorageChangeLog = typeof storageChangeLogs.$inferInsert;

// ENTERPRISE FEATURES: Audit Trail Types (Phase 2.2)
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type AuditConfiguration = typeof auditConfiguration.$inferSelect;
export type InsertAuditConfiguration = typeof auditConfiguration.$inferInsert;

export type SustainabilityFeatures = typeof sustainabilityFeatures.$inferSelect;
export type InsertSustainabilityFeatures = typeof sustainabilityFeatures.$inferInsert;

// Additional Technology Types
export type TechnologyRoadmap = typeof technologyRoadmap.$inferSelect;
export type InsertTechnologyRoadmap = typeof technologyRoadmap.$inferInsert;

export type TechnologyGradientSettings = typeof technologyGradientSettings.$inferSelect;
export type InsertTechnologyGradientSettings = typeof technologyGradientSettings.$inferInsert;

export type TechnologyCta = typeof technologyCta.$inferSelect;
export type InsertTechnologyCta = typeof technologyCta.$inferInsert;

// Navigation & Footer Configuration Types
export type NavigationGlassmorphismSettings = typeof navigationGlassmorphismSettings.$inferSelect;
export type InsertNavigationGlassmorphismSettings =
  typeof navigationGlassmorphismSettings.$inferInsert;

// Additional Sustainability Types (from Zod schemas)
export type SustainabilityFabricPortfolio = z.infer<
  typeof insertSustainabilityFabricPortfolioSchema
>;
export type SustainabilityCallToAction = z.infer<typeof insertSustainabilityCallToActionSchema>;
export type SustainabilitySectionHeaders = z.infer<typeof insertSustainabilitySectionHeadersSchema>;

// Fabric Compositions stub (for relationship queries)
export const fabricCompositions = pgTable("fabric_compositions", {
  id: serial("id").primaryKey(),
  fabricId: integer("fabric_id").references(() => fabrics.id),
  fiberId: integer("fiber_id").references(() => fibers.id),
  percentage: decimal("percentage"),
});

// =============================================================================
// DRIZZLE RELATIONS - Type-safe relational queries (PHASE 2 OPTIMIZATION)
// =============================================================================
// These relations enable clean db.query API instead of verbose manual joins
// Example: db.query.products.findFirst({ with: { category: true, fabric: true } })
// =============================================================================

// Products Relations
export const productsRelations = relations(products, ({ one }) => ({
  // One-to-one with primary image
  primaryImage: one(mediaAssets, {
    fields: [products.primaryImageId],
    references: [mediaAssets.id],
    relationName: "productPrimaryImage",
  }),
  // One-to-one with primary video
  primaryVideo: one(mediaAssets, {
    fields: [products.primaryVideoId],
    references: [mediaAssets.id],
    relationName: "productPrimaryVideo",
  }),
  // One-to-one with 3D model file
  modelFile: one(mediaAssets, {
    fields: [products.modelFileId],
    references: [mediaAssets.id],
    relationName: "productModelFile",
  }),
  // One-to-one with category
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  // One-to-one with fabric
  fabric: one(fabrics, {
    fields: [products.fabricId],
    references: [fabrics.id],
  }),
  // One-to-one with size chart
  sizeChart: one(sizeCharts, {
    fields: [products.sizeChartId],
    references: [sizeCharts.id],
  }),
}));

// Categories Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  // Self-referencing parent category
  parentCategory: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  // One-to-one with primary image
  primaryImage: one(mediaAssets, {
    fields: [categories.primaryImageId],
    references: [mediaAssets.id],
  }),
  // One-to-many with products
  products: many(products),
  // One-to-many with child categories
  childCategories: many(categories, {
    relationName: "categoryHierarchy",
  }),
}));

// Fabrics Relations
export const fabricsRelations = relations(fabrics, ({ one, many }) => ({
  // One-to-one with visual swatch image
  visualSwatch: one(mediaAssets, {
    fields: [fabrics.visualSwatchId],
    references: [mediaAssets.id],
  }),
  // One-to-many with products using this fabric
  products: many(products),
  // One-to-many with fabric compositions (fiber breakdown)
  fabricCompositions: many(fabricCompositions),
}));

// Fibers Relations
export const fibersRelations = relations(fibers, ({ many }) => ({
  // One-to-many with fabric compositions
  fabricCompositions: many(fabricCompositions),
}));

// Certificates Relations
export const certificatesRelations = relations(certificates, ({ one }) => ({
  // One-to-one with certificate image
  image: one(mediaAssets, {
    fields: [certificates.imageId],
    references: [mediaAssets.id],
    relationName: "certificateImage",
  }),
  // One-to-one with certificate document
  document: one(mediaAssets, {
    fields: [certificates.documentId],
    references: [mediaAssets.id],
    relationName: "certificateDocument",
  }),
}));

// Size Charts Relations
export const sizeChartsRelations = relations(sizeCharts, ({ many }) => ({
  // One-to-many with products using this size chart
  products: many(products),
}));

// Accessories Relations
export const accessoriesRelations = relations(accessories, ({ one }) => ({
  // One-to-one with accessory image
  image: one(mediaAssets, {
    fields: [accessories.imageId],
    references: [mediaAssets.id],
  }),
}));

// Fabric Compositions Relations (Junction Table)
export const fabricCompositionsRelations = relations(fabricCompositions, ({ one }) => ({
  // Many-to-one with fabric
  fabric: one(fabrics, {
    fields: [fabricCompositions.fabricId],
    references: [fabrics.id],
  }),
  // Many-to-one with fiber
  fiber: one(fibers, {
    fields: [fabricCompositions.fiberId],
    references: [fibers.id],
  }),
}));
