import { z } from "zod";

/**
 * Schema for bulk reordering navigation items.
 * Migrated from navigation.routes.ts to centralize API contract.
 */
export const navigationReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      sortOrder: z.number(),
    }),
  ),
});

export type NavigationReorderData = z.infer<typeof navigationReorderSchema>;
