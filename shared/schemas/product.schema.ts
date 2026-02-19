import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100).trim(),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes")
    .trim(),
  description: z.string().max(1000, "Description must be under 1000 characters").trim().optional(),
  price: z.number().positive("Price must be positive").optional(),
  categoryId: z.number().int().positive("Category ID must be a positive integer"),
  isActive: z.boolean().default(true),
  tags: z.array(z.string().trim()).optional(),
});

export type ProductSchemaType = z.infer<typeof productSchema>;
