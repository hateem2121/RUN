import { z } from "zod";

/**
 * Generic utility to safely parse an array of items.
 * Filters out any items that fail validation, ensuring the UI only receives valid data.
 * Logs validation errors to console.warn in development.
 */
export function safeParseArray<T>(schema: z.ZodType<T>, data: unknown[]): T[] {
  if (!Array.isArray(data)) {
    if (import.meta.env.DEV) {
      // biome-ignore lint/suspicious/noConsole: debugging
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
        // biome-ignore lint/suspicious/noConsole: debugging
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

  // Relationships
  categoryId: z.number(),
  fabricId: z.number().nullable(),
  sizeChartId: z.number().nullable(),

  // Media
  primaryImageId: z.number().nullable(),
  primaryVideoId: z.number().nullable(),
  imageIds: z.array(z.number()).nullable(),
  videos: z.array(z.any()).nullable(),

  // Business Logic
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  minimumOrderQuantity: z.number().nullable(),
  leadTime: z.string().nullable(),

  // Specifications
  careInstructions: z.any().nullable(),
  technicalSpecs: z.any().nullable(),
  customFit: z.string().nullable(),
  fiberComposition: z.any().nullable(),
  specifications: z.any().nullable(),

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
