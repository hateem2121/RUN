import { z } from "zod";

/**
 * Generic utility to safely parse an array of items.
 * Filters out any items that fail validation, ensuring the UI only receives valid data.
 * Logs validation errors to console.warn in development.
 */
export function safeParseArray<T>(schema: z.ZodType<T>, data: unknown[]): T[] {
  if (!Array.isArray(data)) {
    if (import.meta.env.DEV) {
      console.warn("safeParseArray: Input is not an array", data);
    }
    return [];
  }

  return data.reduce<T[]>((acc, item) => {
    const result = schema.safeParse(item);
    if (result.success) {
      acc.push(result.data);
    } else {
      // In development, log the schema error for debugging
      if (import.meta.env.DEV) {
        console.warn("Schema validation failed for item:", item, result.error);
      }
    }
    return acc;
  }, []);
}

// -- Primitive Schemas --

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
    filename: z.string().default("unknown"), // Enforcing string to match shared schema
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
    // Allow other fields to pass through if needed, or define them all
  })
  .passthrough();

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  parentId: z.number().nullable().optional(),
  isActive: z.boolean().nullable().optional().default(true),
  sortOrder: z.number().nullable().optional().default(0),
});

export const FabricSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullable().optional().default(true),
});

export const CertificateSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullable().optional().default(true),
});

export const SizeChartSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullable().optional().default(true),
});

export const AccessorySchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().nullable().optional().default(true),
});

// -- Product Schema --

export const ProductSummarySchema = z.object({
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
    .record(z.string(), z.union([z.string(), z.number(), z.array(z.number())]))
    .nullable(),
  specifications: z.array(z.string()).nullable(),

  // Tags & Metadata
  tags: z.array(z.string()).nullable(),
  certificateIds: z.array(z.number()).nullable(),
  accessoryIds: z.array(z.number()).nullable(),
  urlPath: z.string().nullable(),

  createdAt: z.date().nullable(),
});

export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Fabric = z.infer<typeof FabricSchema>;
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;
export type SizeChart = z.infer<typeof SizeChartSchema>;
export type Accessory = z.infer<typeof AccessorySchema>;

export const ProductDetailSchema = z.object({
  product: ProductSummarySchema,
  context: z
    .object({
      breadcrumb: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
      category: CategorySchema.nullable().optional(),
    })
    .optional(),
  media: z.array(MediaAssetSchema),
});

export type ProductDetail = z.infer<typeof ProductDetailSchema>;
