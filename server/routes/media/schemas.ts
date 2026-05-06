import { insertMediaAssetSchema } from "@run-remix/shared";
import { z } from "zod";

/**
 * Media Query Schemas
 * Standardized validation for media-related endpoints
 */

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

// MediaUpdateSchema - FIXED: Uses shared schema and corrects isPublic -> isActive mapping
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
