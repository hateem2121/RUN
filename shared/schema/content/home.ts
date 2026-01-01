import {
  boolean,
  index,
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTable } from "../common";
import { mediaAssets } from "../media";

// Homepage Hero
export const homepageHero = pgTable(
  "homepage_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    backgroundImageId: integer("background_image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_hero_is_active_idx").on(table.isActive),
    index("homepage_hero_background_image_id_idx").on(table.backgroundImageId),
    index("homepage_hero_sort_order_idx").on(table.sortOrder),
  ],
);

// Homepage Slogans
export const homepageSlogans = pgTable(
  "homepage_slogans",
  {
    id: serial("id").primaryKey(),
    text: text("text").notNull(),
    position: varchar("position", { length: 50 }),
    fontSize: varchar("font_size", { length: 20 }),
    color: varchar("color", { length: 20 }),
    animationType: varchar("animation_type", { length: 50 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_slogans_is_active_idx").on(table.isActive),
    index("homepage_slogans_sort_order_idx").on(table.sortOrder),
  ],
);

// Homepage Process Cards
export const homepageProcessCards = pgTable(
  "homepage_process_cards",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    iconName: varchar("icon_name", { length: 100 }),
    step: integer("step").notNull(),

    // Additional fields to match frontend expectations
    icon: varchar("icon", { length: 100 }), // For text/emoji icons
    iconMediaId: integer("icon_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // For image icons
    iconType: varchar("icon_type", { length: 20 }), // 'text' or 'image'
    category: varchar("category", { length: 100 }), // process category
    position: integer("position").default(0), // position/order

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_process_cards_is_active_idx").on(table.isActive),
    index("homepage_process_cards_image_id_idx").on(table.imageId),
    index("homepage_process_cards_icon_media_id_idx").on(table.iconMediaId),
    index("homepage_process_cards_sort_order_idx").on(table.sortOrder),
  ],
);

// Homepage Sections
export const homepageSections = pgTable(
  "homepage_sections",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    heroTitle: varchar("hero_title", { length: 255 }), // Additional hero title field for compatibility
    content: text("content"),
    sectionType: varchar("section_type", { length: 100 }).notNull(),
    data: jsonb("data").$type<Record<string, any>>(),
    mediaIds: jsonb("media_ids").$type<number[]>(), // Missing property causing errors
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("homepage_sections_is_active_idx").on(table.isActive),
    index("homepage_sections_sort_order_idx").on(table.sortOrder),
  ],
);

// Homepage Featured Products Settings
export const homepageFeaturedProductsSettings = pgTable("homepage_featured_products_settings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  maxProducts: integer("max_products").default(8),
  autoSelect: boolean("auto_select").default(true),
  selectedProductIds: jsonb("selected_product_ids").$type<number[]>(),
  sortBy: varchar("sort_by", { length: 50 }).default("featured"),
  isActive: boolean("is_active").default(true),

  // Animation Settings - Phase 4 Schema Alignment
  isEnabled: boolean("is_enabled").default(true),
  dotGrid: jsonb("dot_grid").$type<{
    dotSize: number;
    gap: number;
    baseColor: string;
    activeColor: string;
    proximity: number;
    shockRadius: number;
    shockStrength: number;
    resistance: number;
    returnDuration: number;
  }>(),
  liquidGlass: jsonb("liquid_glass").$type<{
    blur: number;
    opacity: number;
    borderOpacity: number;
    cardHoverScale: number;
  }>(),
  swipeAnimation: jsonb("swipe_animation").$type<{
    transitionDuration: number;
    easing:
      | "ease-out"
      | "ease-in"
      | "ease-in-out"
      | "ease"
      | "linear"
      | "easeIn"
      | "easeOut"
      | "easeInOut";
  }>(),

  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Types
export type HomepageHero = typeof homepageHero.$inferSelect;
export type InsertHomepageHero = typeof homepageHero.$inferInsert;

export type HomepageSlogan = typeof homepageSlogans.$inferSelect;
export type InsertHomepageSlogan = typeof homepageSlogans.$inferInsert;

export type HomepageProcessCard = typeof homepageProcessCards.$inferSelect;
export type InsertHomepageProcessCard = typeof homepageProcessCards.$inferInsert;

export type HomepageSection = typeof homepageSections.$inferSelect;
export type InsertHomepageSection = typeof homepageSections.$inferInsert;

export type HomepageFeaturedProductsSettings = typeof homepageFeaturedProductsSettings.$inferSelect;
export type InsertHomepageFeaturedProductsSettings =
  typeof homepageFeaturedProductsSettings.$inferInsert;

// Zod Schemas
export const insertHomepageHeroSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  backgroundImageId: z.number().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  ctaLink: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const insertHomepageSloganSchema = z.object({
  text: z.string().min(1),
  position: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(), // Accept both, convert to string
  fontSize: z.string().optional(),
  color: z.string().optional(),
  animationType: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const insertHomepageProcessCardSchema = z.object({
  title: z.string().min(1),
  step: z.number().int().positive(),
  description: z.string().optional(),

  // Additional fields to match frontend expectations
  icon: z.string().optional(), // For text/emoji icons
  iconMediaId: z.number().nullable().optional(), // For image icons - accepts null
  iconType: z.enum(["text", "image"]).nullable().optional(), // Icon type selector - accepts null
  category: z.string().optional(), // Process category
  position: z.number().optional(), // Position/order

  isActive: z.boolean().optional(),
});

export const insertHomepageSectionSchema = z.object({
  sectionName: z.string().min(1),
  content: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertHomepageFeaturedProductsSettingsSchema = createInsertSchema(
  homepageFeaturedProductsSettings,
);
export const selectHomepageFeaturedProductsSettingsSchema = createSelectSchema(
  homepageFeaturedProductsSettings,
);
