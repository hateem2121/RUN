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
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTable } from "./common";
import { mediaAssets } from "./media";

// Categories with hierarchical self-reference
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),

    // Self-referencing hierarchy - HARDENED FK INTEGRITY
    parentId: integer("parent_id"),

    // Primary image reference - HARDENED CASCADE
    // TODO: Consider adding an index for faster queries
    primaryImageId: integer("primary_image_id").references(
      () => mediaAssets.id,
      { onDelete: "set null" }, // SAFE: Category can exist without image
    ),

    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    level: integer("level").default(0),
    fullPath: varchar("full_path", { length: 500 }),

    // SEO fields
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),

    // Enhanced fields
    featuredOnHomepage: boolean("featured_on_homepage").default(false),
    gridPosition: integer("grid_position").default(0), // Missing property for grid layout
    displayOrder: integer("display_order").default(0), // Display order for sorting
    // REMOVED 2025-11-14: productCount column (never updated - COUNT queries used instead)
    featuredContent: jsonb("featured_content").$type<Record<string, any>>(),
    bannerUrl: varchar("banner_url", { length: 500 }), // Banner image URL for category pages
    imageUrl: varchar("image_url", { length: 500 }), // Direct image URL (alternative to primaryImageId)

    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),

    // OPTIMISTIC LOCKING: Version field for concurrent access control (Phase 2.3)
    version: integer("version").default(1).notNull(),
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

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1), // REQUIRED: matches database schema
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().nullable().optional(), // FIXED: Allow null values for no parent
  gridPosition: z.number().optional(), // ADDED: missing from schema
  featuredOnHomepage: z.boolean().optional(), // ADDED: missing from schema
  sortOrder: z.number().optional(), // ADDED: missing from schema
  primaryImageId: z.number().nullable().optional(), // CHUNK 10: Object Storage migration

  // SEO fields - align with database schema
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),

  // Image fields - align with database schema
  imageUrl: z.string().max(500).optional(),
  bannerUrl: z.string().max(500).optional(),

  // Display ordering - align with database schema
  displayOrder: z.number().optional(),

  // Featured content - nested structure matching CategoryForm and database JSONB
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
