import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  categoryId: z.number().int().positive("Category ID must be a positive integer"),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

export type ProductSchemaType = z.infer<typeof productSchema>;
