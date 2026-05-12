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

/**
 * Folders Table - Media Organization Structure
 */
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  parentId: integer(),
  path: varchar({ length: 500 }),
  level: integer().default(0),
  isActive: boolean().default(true),
  sortOrder: integer().default(0),
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
});

export type ImageVariants = {
  thumbnail?: string; // 200px - for cards/grids (<50KB)
  medium?: string; // 800px - for product pages (<200KB)
  large?: string; // 1600px - for lightbox/detail (<500KB)
  original?: string; // Compressed original (<500KB)
};

/**
 * Media Assets Table - Centralized Asset Library
 */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: serial("id").primaryKey(),
    filename: varchar({ length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }),
    fileSize: integer("file_size"),
    size: integer(), // Alias for fileSize for compatibility
    mimeType: varchar("mime_type", { length: 100 }).notNull(), // REQUIRED for proper file handling

    // File organization
    type: varchar({ length: 50 }).notNull(), // 'image', 'video', 'model', 'document'
    url: text().notNull(),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailFilename: varchar("thumbnail_filename", { length: 255 }), // For thumbnail reference
    thumbnailStoragePath: text("thumbnail_storage_path"), // Thumbnail storage path in GCS
    imageVariants: jsonb("image_variants").$type<ImageVariants>(),

    // Storage information
    storagePath: text("storage_path").notNull(),
    bucketName: varchar("bucket_name", { length: 100 }).notNull(),

    // Organization
    folderId: integer("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    tags: jsonb().$type<string[]>(),

    // Enhanced metadata
    altText: text("alt_text"),
    caption: text(),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),

    uploadedAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(), // For upload timestamp

    isActive: boolean("is_active").default(true),
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
    index("media_type_active_idx").on(table.type, table.isActive),
    index("media_folder_id_idx").on(table.folderId),
    index("media_created_at_idx").on(table.createdAt.desc()),
    index("media_active_created_idx").on(table.isActive, table.createdAt.desc()),
    index("media_mime_type_idx").on(table.mimeType),
    index("media_hot_query_idx").on(table.deletedAt, table.isActive, table.createdAt.desc()),
    index("media_id_active_idx").on(table.id, table.isActive, table.deletedAt),
    index("media_original_name_idx").on(table.originalName),
    index("media_uploaded_at_idx").on(table.uploadedAt.desc()),
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
  | "thumbnailStoragePath"
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

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Zod Schemas
export const selectMediaAssetSchema = createSelectSchema(mediaAssets);
export const insertMediaAssetSchema = createInsertSchema(mediaAssets, {
  filename: (s) => s.min(1),
  type: (s) => s.min(1),
  mimeType: (s) => s.min(1),
  storagePath: (s) => s.min(1),
  bucketName: (s) => s.min(1),
});

export const selectFolderSchema = createSelectSchema(folders);
export const insertFolderSchema = createInsertSchema(folders, {
  name: (s) => s.min(1),
});

// ============================================================================
// Media Query & Request Schemas (Migrated from server/routes/media)
// ============================================================================

export const MediaListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  type: z.enum(["image", "video", "document", "model"]).optional(),
  search: z.string().optional(),
  folderId: z.coerce.number().optional(),
  sort: z.enum(["createdAt", "size", "name"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const MediaIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a numeric string").transform(Number),
});

export const MediaUploadParamSchema = z.object({
  uploadId: z.string().uuid(),
});

export const FolderCreateSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.coerce.number().optional(),
});

export const FolderUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.coerce.number().optional().nullable(),
});

export const MediaUpdateSchema = insertMediaAssetSchema
  .partial()
  .extend({
    folderId: z.coerce.number().optional().nullable(),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    uploadedAt: true,
    deletedAt: true,
  });

export const PerformanceQuerySchema = z.object({
  path: z.string().optional(),
});

export const baseQueryParamsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
  search: z.string().max(500).optional(),
  type: z.string().optional(),
  tags: z.string().max(1000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
