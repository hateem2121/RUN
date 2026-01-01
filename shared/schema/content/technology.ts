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
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    primaryButtonText: varchar("primary_button_text", { length: 100 }),
    primaryButtonLink: varchar("primary_button_link", { length: 255 }),
    secondaryButtonText: varchar("secondary_button_text", { length: 100 }),
    secondaryButtonLink: varchar("secondary_button_link", { length: 255 }),
    backgroundMediaId: integer("background_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // Preserve existing database column
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
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
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    shortDescription: text("short_description"),
    iconName: varchar("icon_name", { length: 100 }),
    status: varchar("status", { length: 50 }).default("Active"),
    technicalDetails: jsonb("technical_details").$type<Record<string, any>>(),
    relatedProducts: jsonb("related_products").$type<string[]>(),
    benefits: jsonb("benefits").$type<string[]>(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    developmentYear: varchar("development_year", { length: 10 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
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
    name: varchar("name", { length: 255 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 255 }),
    model: varchar("model", { length: 255 }),
    category: varchar("category", { length: 100 }),
    quantity: integer("quantity").default(1),
    capacity: varchar("capacity", { length: 255 }),
    maintenanceSchedule: varchar("maintenance_schedule", { length: 255 }),
    certifications: jsonb("certifications").$type<string[]>(),
    description: text("description"),
    specifications: jsonb("specifications").$type<Record<string, any>>(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    installationDate: timestamp("installation_date", {
      mode: "date",
      precision: 3,
    }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
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
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    researchArea: varchar("research_area", { length: 255 }),
    status: varchar("status", { length: 50 }).default("ongoing"),
    startDate: timestamp("start_date", { mode: "date", precision: 3 }),
    expectedCompletion: timestamp("expected_completion", {
      mode: "date",
      precision: 3,
    }),
    teamMembers: jsonb("team_members").$type<string[]>(),
    objectives: jsonb("objectives").$type<string[]>(),
    partners: jsonb("partners").$type<string[]>(),
    currentProjects:
      jsonb("current_projects").$type<Array<{ name: string; status: string; progress: number }>>(),
    publications: jsonb("publications").$type<string[]>(),
    outcomes: jsonb("outcomes").$type<string[]>(),
    funding: decimal("funding", { precision: 12, scale: 2 }),
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
    index("technology_research_is_active_idx").on(table.isActive),
    index("technology_research_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Roadmap
export const technologyRoadmap = pgTable(
  "technology_roadmap",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    timeline: varchar("timeline", { length: 255 }),
    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
    status: varchar("status", { length: 50 }).default("planned"),
    priority: varchar("priority", { length: 20 }).default("medium"),
    milestones: jsonb("milestones").$type<Record<string, any>>(),
    impact: jsonb("impact").$type<string[]>(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
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
    index("technology_roadmap_is_active_idx").on(table.isActive),
    index("technology_roadmap_sort_order_idx").on(table.sortOrder),
  ],
);

// Technology Gradient Settings
export const technologyGradientSettings = pgTable(
  "technology_gradient_settings",
  {
    id: serial("id").primaryKey(),
    gradientType: varchar("gradient_type", { length: 100 }).notNull(),
    colors: jsonb("colors").$type<string[]>(),
    direction: varchar("direction", { length: 50 }).default("to-right"),
    opacity: decimal("opacity", { precision: 3, scale: 2 }).default("1.0"),
    settings: jsonb("settings").$type<Record<string, any>>(),
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
  (table) => [index("technology_gradient_settings_is_active_idx").on(table.isActive)],
);

// Technology CTA Section
export const technologyCta = pgTable(
  "technology_cta",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    benefits: jsonb("benefits").$type<string[]>(),
    backgroundColor: varchar("background_color", { length: 20 }),
    textColor: varchar("text_color", { length: 20 }),
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
