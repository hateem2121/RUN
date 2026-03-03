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
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    backgroundImageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    ctaText: varchar({ length: 100 }),
    ctaLink: varchar({ length: 255 }),
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp({
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
    text: text().notNull(),
    position: varchar({ length: 50 }),
    fontSize: varchar({ length: 20 }),
    color: varchar({ length: 20 }),
    animationType: varchar({ length: 50 }),
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
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
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    iconName: varchar({ length: 100 }),
    step: integer().notNull(),

    // Additional fields to match frontend expectations
    icon: varchar({ length: 100 }), // For text/emoji icons
    iconMediaId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // For image icons
    iconType: varchar({ length: 20 }), // 'text' or 'image'
    category: varchar({ length: 100 }), // process category
    position: integer().default(0), // position/order

    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
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
    name: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }),
    heroTitle: varchar({ length: 255 }), // Additional hero title field for compatibility
    content: text(),
    sectionType: varchar({ length: 100 }).notNull(),
    data: jsonb().$type<Record<string, any>>(),
    mediaIds: jsonb().$type<number[]>(), // Missing property causing errors
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp({
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
  title: varchar({ length: 255 }),
  maxProducts: integer().default(8),
  autoSelect: boolean().default(true),
  selectedProductIds: jsonb().$type<number[]>(),
  sortBy: varchar({ length: 50 }).default("featured"),
  isActive: boolean().default(true),

  // Animation Settings - Phase 4 Schema Alignment
  isEnabled: boolean().default(true),
  dotGrid: jsonb().$type<{
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
  liquidGlass: jsonb().$type<{
    blur: number;
    opacity: number;
    borderOpacity: number;
    cardHoverScale: number;
  }>(),
  swipeAnimation: jsonb().$type<{
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

  createdAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp({
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
