import {
  AccessoryResponseSchema as AccessorySchema,
  CategoryResponseSchema as CategorySchema,
  CertificateResponseSchema as CertificateSchema,
  FabricResponseSchema as FabricSchema,
  MediaAssetSchema,
  ProductDetailResponseSchema as ProductDetailSchema,
  ProductSummaryResponseSchema as ProductSummarySchema,
  SizeChartResponseSchema as SizeChartSchema,
} from "@shared/index";
import type { z } from "zod";

// Re-export under the names the rest of the client uses
export {
  AccessorySchema,
  CategorySchema,
  CertificateSchema,
  FabricSchema,
  MediaAssetSchema,
  ProductDetailSchema,
  ProductSummarySchema,
  SizeChartSchema,
};

export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Fabric = z.infer<typeof FabricSchema>;
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;
export type SizeChart = z.infer<typeof SizeChartSchema>;
export type Accessory = z.infer<typeof AccessorySchema>;
export type ProductDetail = z.infer<typeof ProductDetailSchema>;

/**
 * Generic utility to safely parse an array of items.
 * Filters out any items that fail validation, ensuring the UI only receives valid data.
 * Logs validation errors to console.warn in development.
 * NOTE: Uses import.meta.env.DEV (Vite API) — must stay in client/
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
      if (import.meta.env.DEV) {
        console.warn("Schema validation failed for item:", item, result.error);
      }
    }
    return acc;
  }, []);
}
