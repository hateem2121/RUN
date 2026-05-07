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
import { certificates } from "../catalog";
import { pgTable } from "../common";
import { mediaAssets } from "../media";

// Manufacturing Hero
export const manufacturingHero = pgTable(
  "manufacturing_hero",
  {
    id: serial("id").primaryKey(),
    headline: varchar({ length: 255 }).notNull(),
    subheadline: text(),
    description: text(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    backgroundMediaId: integer("background_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),

    // Bottom Call to Action Section
    bottomCtaTitle: varchar("bottom_cta_title", { length: 255 }),
    bottomCtaDescription: text("bottom_cta_description"),
    bottomCtaText: varchar("bottom_cta_text", { length: 100 }),
    bottomCtaLink: varchar("bottom_cta_link", { length: 255 }),

    isActive: boolean("is_active").default(true),
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
    iconName: varchar("icon_name", { length: 100 }),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    mediaIds: jsonb("media_ids").$type<number[]>(),
    equipment: jsonb("equipment").$type<string[]>(),
    specifications: jsonb("specifications").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
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
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    equipment: jsonb("equipment").$type<string[]>(),
    specifications: jsonb("specifications").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
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
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    certificateId: integer("certificate_id").references(() => certificates.id, {
      onDelete: "set null",
    }),
    category: varchar("category", { length: 100 }),
    testingMethod: varchar("testing_method", { length: 255 }),
    frequency: varchar("frequency", { length: 100 }),
    checkpoints: jsonb("checkpoints").$type<string[]>(),
    criteria: jsonb("criteria").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
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

// Manufacturing Case Studies
export const manufacturingCaseStudies = pgTable(
  "manufacturing_case_studies",
  {
    id: serial("id").primaryKey(),
    client: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(), // e.g., "High-Performance Teamwear"
    metric: varchar({ length: 100 }).notNull(), // e.g., "-22% Lead Time"
    description: text().notNull(),
    quote: text().notNull(),
    author: varchar({ length: 255 }).notNull(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
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
    index("manufacturing_case_studies_is_active_idx").on(table.isActive),
    index("manufacturing_case_studies_image_id_idx").on(table.imageId),
    index("manufacturing_case_studies_sort_order_idx").on(table.sortOrder),
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

export type ManufacturingCaseStudy = typeof manufacturingCaseStudies.$inferSelect;
export type InsertManufacturingCaseStudy = typeof manufacturingCaseStudies.$inferInsert;

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

export const insertManufacturingCaseStudySchema = createInsertSchema(manufacturingCaseStudies);
export const selectManufacturingCaseStudySchema = createSelectSchema(manufacturingCaseStudies);
