import { z } from "zod";

/**
 * Generic utility to safely parse an array of items.
 * Filters out any items that fail validation, ensuring the UI only receives valid data.
 * Logs validation errors to console.warn in development.
 */
export function safeParseArray<T>(schema: z.ZodType<T>, data: unknown[]): T[] {
  if (!Array.isArray(data)) {
    console.warn("safeParseArray: Input is not an array", data);
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

export const MediaAssetSchema = z.object({
  id: z.number(),
  url: z.string(),
  type: z.string(), // 'image', 'video', etc.
  thumbnailUrl: z.string().nullable().optional(),
  mimeType: z.string().optional(),
  altText: z.string().nullable().optional(),
});

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  parentId: z.number().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

export const FabricSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().optional().default(true),
});

export const CertificateSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().optional().default(true),
});

export const SizeChartSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().optional().default(true),
});

export const AccessorySchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().optional().default(true),
});

// -- Product Schema --

export const ProductSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  description: z.string().nullable().optional(),

  // Relationships
  categoryId: z.number(),
  fabricId: z.number().nullable().optional(),
  sizeChartId: z.number().nullable().optional(),

  // Media
  primaryImageId: z.number().nullable().optional(),
  primaryVideoId: z.number().nullable().optional(),
  imageIds: z.array(z.number()).nullable().optional(),
  videos: z.array(z.any()).nullable().optional(), // Strict typing for complex JSONB or keep any for flexibility

  // Business Logic
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  minimumOrderQuantity: z.union([z.string(), z.number()]).nullable().optional(),

  // Tags & Metadata
  tags: z.array(z.string()).nullable().optional(),
  certificateIds: z.array(z.number()).nullable().optional(),
  accessoryIds: z.array(z.number()).nullable().optional(),

  createdAt: z.union([z.string(), z.date()]).optional(),
});

export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Fabric = z.infer<typeof FabricSchema>;
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
