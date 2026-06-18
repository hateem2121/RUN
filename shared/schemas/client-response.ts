import { z } from "zod";

/**
 * Client API Response Schemas
 *
 * These schemas validate data received by the client from the server API.
 * They are intentionally more lenient than the server-side Drizzle schemas:
 * - Use z.coerce.date() to handle date strings in JSON responses
 * - Use .passthrough() to tolerate extra fields during API evolution
 * - Provide default values for nullable fields
 *
 * These must live in @run-remix/shared so both the client (for validation)
 * and server (for type-checking response shapes) can reference them.
 */

export const MediaAssetSchema = z
  .object({
    id: z.number(),
    url: z.string(),
    type: z.string(), // 'image', 'video', 'model', etc.
    thumbnailUrl: z.string().nullable().default(null),
    mimeType: z.string().default("application/octet-stream"),
    altText: z.string().nullable().default(null),
    caption: z.string().nullable().default(null),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .default({}),
    isActive: z.boolean().nullable().default(true),
    tags: z.array(z.string()).nullable().default([]),
    originalName: z.string().nullable().default(null),
    filename: z.string().default("unknown"),
    size: z.number().nullable().default(0),
    createdAt: z.coerce.date().nullable().default(null),
    updatedAt: z.coerce.date().nullable().default(null),
    uploadedAt: z.coerce.date().nullable().default(null),
    deletedAt: z.coerce.date().nullable().default(null),
    fileSize: z.number().nullable().default(0),
    bucketName: z.string().default(""),
    imageVariants: z.record(z.string(), z.string()).nullable().default(null),
    thumbnailFilename: z.string().nullable().default(null),
    thumbnailStoragePath: z.string().nullable().default(null),
    folderId: z.number().nullable().default(null),
    storagePath: z.string().default(""),
    blurhash: z.string().nullable().default(null),
    dimensionWidth: z.number().nullable().default(null),
    dimensionHeight: z.number().nullable().default(null),
  })
  .passthrough();

export const CategoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  parentId: z.number().nullish(),
  isActive: z.boolean().nullish().default(true),
  sortOrder: z.number().nullish().default(0),
});

export const FabricResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullish().default(true),
});

export const CertificateResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullish().default(true),
});

export const SizeChartResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullish().default(true),
});

export const AccessoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullish().default(true),
});

export const ProductSummaryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),

  // Relationships
  categoryId: z.number(),
  fabricId: z.number().nullable(),
  sizeChartId: z.number().nullable(),

  // Media
  primaryImageId: z.number().nullable(),
  primaryVideoId: z.number().nullable(),
  imageIds: z.array(z.number()).nullable(),
  videos: z.array(MediaAssetSchema).nullable(),

  // Business Logic
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  minimumOrderQuantity: z.number().nullable(),
  leadTime: z.string().nullable(),

  // Specifications
  careInstructions: z.array(z.string()).nullable(),
  technicalSpecs: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
    .nullable(),
  customFit: z.string().nullable(),
  fiberComposition: z
    .union([
      z.record(z.string(), z.union([z.string(), z.number(), z.array(z.number())])),
      z.string(),
    ])
    .nullable(),
  specifications: z.array(z.string()).nullable(),

  // Tags & Metadata
  tags: z.array(z.string()).nullable(),
  certificateIds: z.array(z.number()).nullable(),
  accessoryIds: z.array(z.number()).nullable(),
  urlPath: z.string().nullable(),

  createdAt: z.coerce.date().nullable(),
});

export const ProductDetailResponseSchema = z.object({
  product: ProductSummaryResponseSchema,
  context: z
    .object({
      breadcrumb: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
      category: CategoryResponseSchema.nullish(),
    })
    .optional(),
  media: z.array(MediaAssetSchema),
});

// Type exports
export type MediaAssetResponse = z.infer<typeof MediaAssetSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type FabricResponse = z.infer<typeof FabricResponseSchema>;
export type CertificateResponse = z.infer<typeof CertificateResponseSchema>;
export type SizeChartResponse = z.infer<typeof SizeChartResponseSchema>;
export type AccessoryResponse = z.infer<typeof AccessoryResponseSchema>;
export type ProductSummaryResponse = z.infer<typeof ProductSummaryResponseSchema>;
export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;
