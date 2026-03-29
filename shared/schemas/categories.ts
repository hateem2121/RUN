import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTable } from "./common";
import { mediaAssets } from "./media";

/**
 * Categories Table - Hierarchical Product Organization
 *
 * @table categories
 * @description Hierarchical category tree for organizing products.
 * Supports unlimited nesting via self-referencing `parentId`.
 *
 * @business Categories form the primary navigation structure for the B2B catalog.
 * Products must belong to exactly one category. Categories can be featured on homepage.
 *
 * @hierarchy
 * - `parentId` → self-reference for parent category (nullable, set null on delete)
 * - `level` indicates depth in hierarchy (0 = root, 1 = child, etc.)
 * - `fullPath` stores computed path like "running/shoes/trail"
 *
 * @relationships
 * - `primaryImageId` → `mediaAssets.id` (optional, set null)
 * - Parent categories are protected from deletion if children exist
 *
 * @softDelete Uses `deletedAt` timestamp with unique constraint respecting soft-deletes
 *
 * @concurrency `version` field for optimistic locking (Phase 2.3)
 *
 * @example
 * ```typescript
 * // Get all active root categories
 * const roots = await db.select()
 *   .from(categories)
 *   .where(and(
 *     isNull(categories.parentId),
 *     eq(categories.isActive, true),
 *     isNull(categories.deletedAt)
 *   ));
 * ```
 */
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    description: text(),

    // Self-referencing hierarchy - HARDENED FK INTEGRITY
    parentId: integer(),

    // Primary image reference - HARDENED CASCADE
    // TODO: Consider adding an index for faster queries
    primaryImageId: integer().references(
      () => mediaAssets.id,
      { onDelete: "set null" }, // SAFE: Category can exist without image
    ),

    sortOrder: integer().default(0),
    isActive: boolean().default(true),
    level: integer().default(0),
    fullPath: varchar({ length: 500 }),

    // SEO fields
    metaTitle: varchar({ length: 255 }),
    metaDescription: text(),

    // Enhanced fields
    featuredOnHomepage: boolean().default(false),
    gridPosition: integer().default(0), // Missing property for grid layout
    displayOrder: integer().default(0), // Display order for sorting
    // REMOVED 2025-11-14: productCount column (never updated - COUNT queries used instead)
    featuredContent: jsonb().$type<Record<string, unknown>>(),
    bannerUrl: varchar({ length: 500 }), // Banner image URL for category pages
    imageUrl: varchar({ length: 500 }), // Direct image URL (alternative to primaryImageId)

    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp({ mode: "date", precision: 3 }),

    // OPTIMISTIC LOCKING: Version field for concurrent access control (Phase 2.3)
    version: integer().default(1).notNull(),
  },
  (table) => [
    // Self-referencing foreign key - defined here to avoid implicit 'any' during type inference
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "categories_parent_id_fk",
    }).onDelete("set null"), // SAFE: Child categories become top-level if parent deleted
    // PERFORMANCE INDEXES for hot query paths
    index("categories_is_active_idx").on(table.isActive),
    index("categories_parent_id_idx").on(table.parentId),
    index("categories_active_created_idx").on(table.isActive, table.createdAt.desc()),
    index("categories_featured_idx").on(table.featuredOnHomepage),
    // PERFORMANCE FIX: Index for hierarchical category queries
    index("categories_full_path_idx").on(table.fullPath),
    // CRITICAL FIX: Partial unique index for slug that respects soft-deletes
    // Allows reusing slugs after categories are deleted
    uniqueIndex("categories_slug_unique_active")
      .on(table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const selectCategorySchema = createSelectSchema(categories);

export const insertCategorySchema = createInsertSchema(categories, {
  name: (s) => s.min(1),
  slug: (s) => s.min(1),
  metaTitle: (s) => s.max(255),
  imageUrl: (s) => s.max(500),
  bannerUrl: (s) => s.max(500),
  featuredContent: z
    .object({
      card1: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
          maskSvgUrl: z.string().optional(),
          contentMediaUrl: z.string().optional(),
        })
        .optional(),
      card2: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
          expandedContent: z
            .array(
              z.object({
                title: z.string(),
                text: z.string(),
              }),
            )
            .optional(),
        })
        .optional(),
      card3: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
          subtitle: z.string().optional(),
          features: z.array(z.string()).optional(),
        })
        .optional(),
      card4: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          mediaUrl: z.string().optional(),
          link: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
