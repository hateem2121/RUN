import { z } from "zod";

/**
 * Validation schema for product listing queries.
 * Handles pagination and filtering parameters.
 */
export const productsQuerySchema = z.object({
  category: z.string().optional(),
  active: z.string().optional(),
  featured: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * Validation schema for product lookup by hierarchical path.
 */
export const productByPathSchema = z.object({
  path: z.string().min(1, "Path parameter is required"),
});

export type ProductsQueryData = z.infer<typeof productsQuerySchema>;
export type ProductByPathData = z.infer<typeof productByPathSchema>;

/**
 * Validation schema for admin product listing queries.
 */
export const adminProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
});

export type AdminProductsQueryData = z.infer<typeof adminProductsQuerySchema>;
