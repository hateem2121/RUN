import {
  boolean,
  decimal,
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

// Technology Hero
export const technologyHero = pgTable(
  "technology_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    description: text(),
    primaryButtonText: varchar({ length: 100 }),
    primaryButtonLink: varchar({ length: 255 }),
    secondaryButtonText: varchar({ length: 100 }),
    secondaryButtonLink: varchar({ length: 255 }),
    backgroundMediaId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // Preserve existing database column
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
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
    index("technology_hero_is_active_idx").on(table.isActive),
    index("technology_hero_image_id_idx").on(table.imageId),
    index("technology_hero_video_id_idx").on(table.videoId),
    index("technology_hero_background_media_id_idx").on(table.backgroundMediaId),
  ],
);

// Technology Innovations
export const technologyInnovations = pgTable(
  "technology_innovations",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    category: varchar({ length: 100 }),
    shortDescription: text(),
    iconName: varchar({ length: 100 }),
    status: varchar({ length: 50 }).default("Active"),
    technicalDetails: jsonb().$type<Record<string, any>>(),
    relatedProducts: jsonb().$type<string[]>(),
    benefits: jsonb().$type<string[]>(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    developmentYear: varchar({ length: 10 }),
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("technology_innovations_is_active_idx").on(table.isActive),
    index("technology_innovations_image_id_idx").on(table.imageId),
    index("technology_innovations_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Equipment
export const technologyEquipment = pgTable(
  "technology_equipment",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    manufacturer: varchar({ length: 255 }),
    model: varchar({ length: 255 }),
    category: varchar({ length: 100 }),
    quantity: integer().default(1),
    capacity: varchar({ length: 255 }),
    maintenanceSchedule: varchar({ length: 255 }),
    certifications: jsonb().$type<string[]>(),
    description: text(),
    specifications: jsonb().$type<Record<string, any>>(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    installationDate: timestamp({
      mode: "date",
      precision: 3,
    }),
    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("technology_equipment_is_active_idx").on(table.isActive),
    index("technology_equipment_image_id_idx").on(table.imageId),
    index("technology_equipment_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Research
export const technologyResearch = pgTable(
  "technology_research",
  {
    id: serial("id").primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    researchArea: varchar({ length: 255 }),
    status: varchar({ length: 50 }).default("ongoing"),
    startDate: timestamp({ mode: "date", precision: 3 }),
    expectedCompletion: timestamp({
      mode: "date",
      precision: 3,
    }),
    teamMembers: jsonb().$type<string[]>(),
    objectives: jsonb().$type<string[]>(),
    partners: jsonb().$type<string[]>(),
    currentProjects: jsonb().$type<Array<{ name: string; status: string; progress: number }>>(),
    publications: jsonb().$type<string[]>(),
    outcomes: jsonb().$type<string[]>(),
    funding: decimal({ precision: 12, scale: 2 }),
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
    index("technology_research_is_active_idx").on(table.isActive),
    index("technology_research_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Roadmap
export const technologyRoadmap = pgTable(
  "technology_roadmap",
  {
    id: serial("id").primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    timeline: varchar({ length: 255 }),
    targetDate: timestamp({ mode: "date", precision: 3 }),
    status: varchar({ length: 50 }).default("planned"),
    priority: varchar({ length: 20 }).default("medium"),
    milestones: jsonb().$type<Record<string, any>>(),
    impact: jsonb().$type<string[]>(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
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
    index("technology_roadmap_is_active_idx").on(table.isActive),
    index("technology_roadmap_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Gradient Settings
export const technologyGradientSettings = pgTable(
  "technology_gradient_settings",
  {
    id: serial("id").primaryKey(),
    gradientType: varchar({ length: 100 }).notNull(),
    colors: jsonb().$type<string[]>(),
    direction: varchar({ length: 50 }).default("to-right"),
    opacity: decimal({ precision: 3, scale: 2 }).default("1.0"),
    settings: jsonb().$type<Record<string, any>>(),
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
  (table) => [index("technology_gradient_settings_is_active_idx").on(table.isActive)],
);

// Technology CTA Section
export const technologyCta = pgTable(
  "technology_cta",
  {
    id: serial("id").primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    content: text(),
    ctaText: varchar({ length: 100 }),
    ctaLink: varchar({ length: 255 }),
    benefits: jsonb().$type<string[]>(),
    backgroundColor: varchar({ length: 20 }),
    textColor: varchar({ length: 20 }),
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
  (table) => [index("technology_cta_is_active_idx").on(table.isActive)],
);

// Types
export type TechnologyHero = typeof technologyHero.$inferSelect;
export type InsertTechnologyHero = typeof technologyHero.$inferInsert;

export type TechnologyInnovation = typeof technologyInnovations.$inferSelect;
export type InsertTechnologyInnovation = typeof technologyInnovations.$inferInsert;

export type TechnologyEquipment = typeof technologyEquipment.$inferSelect;
export type InsertTechnologyEquipment = typeof technologyEquipment.$inferInsert;

export type TechnologyResearch = typeof technologyResearch.$inferSelect;
export type InsertTechnologyResearch = typeof technologyResearch.$inferInsert;

export type TechnologyRoadmap = typeof technologyRoadmap.$inferSelect;
export type InsertTechnologyRoadmap = typeof technologyRoadmap.$inferInsert;

export type TechnologyGradientSettings = typeof technologyGradientSettings.$inferSelect;
export type InsertTechnologyGradientSettings = typeof technologyGradientSettings.$inferInsert;

export type TechnologyCta = typeof technologyCta.$inferSelect;
export type InsertTechnologyCta = typeof technologyCta.$inferInsert;

// Zod Schemas
export const insertTechnologyHeroSchema = createInsertSchema(technologyHero);
export const selectTechnologyHeroSchema = createSelectSchema(technologyHero);

export const insertTechnologyInnovationSchema = createInsertSchema(technologyInnovations);
export const selectTechnologyInnovationSchema = createSelectSchema(technologyInnovations);

export const insertTechnologyEquipmentSchema = createInsertSchema(technologyEquipment);
export const selectTechnologyEquipmentSchema = createSelectSchema(technologyEquipment);

export const insertTechnologyResearchSchema = createInsertSchema(technologyResearch);
export const selectTechnologyResearchSchema = createSelectSchema(technologyResearch);

export const insertTechnologyRoadmapSchema = createInsertSchema(technologyRoadmap);
export const selectTechnologyRoadmapSchema = createSelectSchema(technologyRoadmap);

export const insertTechnologyGradientSettingsSchema = createInsertSchema(
  technologyGradientSettings,
);
export const selectTechnologyGradientSettingsSchema = createSelectSchema(
  technologyGradientSettings,
);

export const technologyGradientFrontendSchema = z.object({
  gradientColors: z.array(z.string()).optional(),
  angle: z.union([z.string(), z.number()]).optional(),
  spotlightOpacity: z.union([z.string(), z.number()]).optional(),
  isActive: z.boolean().optional(),
});

export const insertTechnologyCtaSchema = createInsertSchema(technologyCta);
export const selectTechnologyCtaSchema = createSelectSchema(technologyCta);
