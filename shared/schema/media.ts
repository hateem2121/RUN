import { sql } from "drizzle-orm";
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
import { z } from "zod";
import { pgTable } from "./common";

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
    metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),

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

// Types
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;

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

export type MediaAssetSummary = MediaAssetDetail;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

// Zod Schemas
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

export const insertFolderSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.number().int().positive().optional().nullable(),
});
