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
import { pgTable } from "../common";
import { mediaAssets } from "../media";

// Manufacturing Hero
export const manufacturingHero = pgTable(
  "manufacturing_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    headline: varchar({ length: 255 }), // Frontend alias for title
    subheadline: text(), // Frontend alias for subtitle
    description: text(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    backgroundMediaId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // Missing property causing errors
    ctaText: varchar({ length: 100 }), // Call-to-action button text
    ctaLink: varchar({ length: 255 }), // Call-to-action button link

    // Bottom Call to Action Section
    bottomCtaTitle: varchar({ length: 255 }),
    bottomCtaDescription: text(),
    bottomCtaText: varchar({ length: 100 }),
    bottomCtaLink: varchar({ length: 255 }),

    isActive: boolean().default(true),
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
    index("manufacturing_hero_is_active_idx").on(table.isActive),
    index("manufacturing_hero_image_id_idx").on(table.imageId),
    index("manufacturing_hero_video_id_idx").on(table.videoId),
    index("manufacturing_hero_background_media_id_idx").on(table.backgroundMediaId),
  ],
);

// Manufacturing Processes
export const manufacturingProcesses = pgTable(
  "manufacturing_processes",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }), // Frontend alias for name
    description: text(),
    step: integer().notNull(),
    position: integer(), // Visual position/layout index
    duration: varchar({ length: 100 }),
    efficiency: integer(), // Process efficiency metric (0-100 percentage)
    category: varchar({ length: 100 }), // Process category/type
    iconName: varchar({ length: 100 }), // Icon identifier for UI display
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    mediaIds: jsonb().$type<number[]>(), // Additional media for process visualization
    equipment: jsonb().$type<string[]>(),
    specifications: jsonb().$type<Record<string, any>>(),
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("manufacturing_processes_is_active_idx").on(table.isActive),
    index("manufacturing_processes_image_id_idx").on(table.imageId),
    index("manufacturing_processes_sort_order_idx").on(table.sortOrder),
  ],
);

// Manufacturing Capabilities
export const manufacturingCapabilities = pgTable(
  "manufacturing_capabilities",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }), // Frontend alias for name
    description: text(),
    capacity: varchar({ length: 255 }),
    unit: varchar({ length: 50 }),
    category: varchar({ length: 100 }),
    icon: varchar({ length: 100 }), // Icon for capability display
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    equipment: jsonb().$type<string[]>(), // Equipment list for this capability
    specifications: jsonb().$type<Record<string, any>>(),
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("manufacturing_capabilities_is_active_idx").on(table.isActive),
    index("manufacturing_capabilities_image_id_idx").on(table.imageId),
    index("manufacturing_capabilities_sort_order_idx").on(table.sortOrder),
  ],
);

// Manufacturing Quality
export const manufacturingQualities = pgTable(
  "manufacturing_qualities",
  {
    id: serial("id").primaryKey(),
    standards: text().array(), // Quality standards array to match frontend
    title: varchar({ length: 255 }), // Frontend display title
    description: text(),
    icon: varchar({ length: 100 }), // Icon for quality standard display
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    certificateId: integer("certificate_id"),
    category: varchar({ length: 100 }), // Quality standard category
    testingMethod: varchar({ length: 255 }),
    frequency: varchar({ length: 100 }), // Testing frequency (e.g., "Every batch", "Monthly")
    checkpoints: jsonb().$type<string[]>(), // Quality control checkpoints
    criteria: jsonb().$type<Record<string, any>>(),
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("manufacturing_qualities_is_active_idx").on(table.isActive),
    index("manufacturing_qualities_image_id_idx").on(table.imageId),
    index("manufacturing_qualities_sort_order_idx").on(table.sortOrder),
  ],
);

// Types
export type ManufacturingHero = typeof manufacturingHero.$inferSelect;
export type InsertManufacturingHero = typeof manufacturingHero.$inferInsert;

export type ManufacturingProcess = typeof manufacturingProcesses.$inferSelect;
export type InsertManufacturingProcess = typeof manufacturingProcesses.$inferInsert;

export type ManufacturingCapability = typeof manufacturingCapabilities.$inferSelect;
export type InsertManufacturingCapability = typeof manufacturingCapabilities.$inferInsert;

export type ManufacturingQuality = typeof manufacturingQualities.$inferSelect;
export type InsertManufacturingQuality = typeof manufacturingQualities.$inferInsert;

// Zod Schemas
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertManufacturingHeroSchema = createInsertSchema(manufacturingHero);
export const selectManufacturingHeroSchema = createSelectSchema(manufacturingHero);

export const insertManufacturingProcessSchema = createInsertSchema(manufacturingProcesses);
export const selectManufacturingProcessSchema = createSelectSchema(manufacturingProcesses);

export const insertManufacturingCapabilitySchema = createInsertSchema(manufacturingCapabilities);
export const selectManufacturingCapabilitySchema = createSelectSchema(manufacturingCapabilities);

export const insertManufacturingQualitySchema = createInsertSchema(manufacturingQualities);
export const selectManufacturingQualitySchema = createSelectSchema(manufacturingQualities);
