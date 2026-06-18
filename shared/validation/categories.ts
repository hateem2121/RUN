import { z } from "zod";

/**
 * Validation schema for category reordering.
 * Used by admin dashboard for drag-and-drop category management.
 */
export const categoryReorderSchema = z.object({
  categories: z.array(
    z.object({
      id: z.number(),
      sortOrder: z.number(),
      parentId: z.number().nullish(),
    }),
  ),
});

export type CategoryReorderData = z.infer<typeof categoryReorderSchema>;
