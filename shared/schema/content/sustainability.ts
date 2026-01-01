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

// Sustainability Hero
export const sustainabilityHero = pgTable(
  "sustainability_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
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
    index("sustainability_hero_is_active_idx").on(table.isActive),
    index("sustainability_hero_image_id_idx").on(table.imageId),
    index("sustainability_hero_video_id_idx").on(table.videoId),
  ],
);

// Sustainability Metrics
export const sustainabilityMetrics = pgTable(
  "sustainability_metrics",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    value: varchar("value", { length: 100 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    iconName: varchar("icon_name", { length: 100 }),

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
    index("sustainability_metrics_is_active_idx").on(table.isActive),
    index("sustainability_metrics_sort_order_idx").on(table.sortOrder),
  ],
);

// Sustainability Initiatives
export const sustainabilityInitiatives = pgTable(
  "sustainability_initiatives",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    impact: text("impact"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Frontend compatibility: Additional categorization fields
    iconName: varchar("icon_name", { length: 50 }),
    category: varchar("category", { length: 100 }),
    highlightedFeatures: jsonb("highlighted_features").$type<string[]>(), // Key features to highlight

    status: varchar("status", { length: 50 }).default("active"),
    startDate: timestamp("start_date", { mode: "date", precision: 3 }),
    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
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
    index("sustainability_initiatives_is_active_idx").on(table.isActive),
    index("sustainability_initiatives_image_id_idx").on(table.imageId),
    index("sustainability_initiatives_sort_order_idx").on(table.sortOrder),
  ],
);

// Sustainability Goals
export const sustainabilityGoals = pgTable(
  "sustainability_goals",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    target: varchar("target", { length: 255 }),
    currentProgress: decimal("current_progress", { precision: 5, scale: 2 }),

    // Frontend compatibility: Numeric values for progress tracking
    currentValue: decimal("current_value", { precision: 10, scale: 2 }),
    targetValue: decimal("target_value", { precision: 10, scale: 2 }),
    targetYear: integer("target_year"),
    unit: varchar("unit", { length: 50 }), // Unit for currentValue/targetValue

    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
    category: varchar("category", { length: 100 }),
    priority: varchar("priority", { length: 20 }).default("medium"),
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
    index("sustainability_goals_is_active_idx").on(table.isActive),
    index("sustainability_goals_sort_order_idx").on(table.sortOrder),
  ],
);

// Additional entities from research (unified sustainability, features, etc.)
export const sustainabilityFeatures = pgTable("sustainability_features", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  impact: text("impact"),
  imageId: integer("image_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  metrics: jsonb("metrics").$type<Record<string, any>>(),
  highlightedFeatures:
    jsonb("highlighted_features").$type<Array<{ title: string; description: string }>>(), // Key features to highlight
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

export const unifiedSustainability = pgTable("unified_sustainability", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  headline: varchar("headline", { length: 255 }), // Frontend display headline
  subheadline: text("subheadline"), // Frontend display subheadline
  content: text("content"),
  sectionType: varchar("section_type", { length: 100 }).notNull(),
  data: jsonb("data").$type<Record<string, any>>(),
  // REMOVED: metrics JSONB column (use sustainability_metrics table instead)
  ctaText: varchar("cta_text", { length: 100 }), // Call-to-action button text
  ctaLink: varchar("cta_link", { length: 255 }), // Call-to-action button link

  // Section-specific titles and descriptions
  metricsTitle: varchar("metrics_title", { length: 255 }),
  metricsDescription: text("metrics_description"),
  certificationsTitle: varchar("certifications_title", { length: 255 }),
  certificationsDescription: text("certifications_description"),
  certificationsFooterNote: text("certifications_footer_note"),
  certificationIds: jsonb("certification_ids").$type<number[]>(), // Array of certification IDs
  initiativesTitle: varchar("initiatives_title", { length: 255 }),
  initiativesDescription: text("initiatives_description"),
  goalsTitle: varchar("goals_title", { length: 255 }),
  goalsDescription: text("goals_description"),
  fabricPortfolioTitle: varchar("fabric_portfolio_title", { length: 255 }),
  fabricPortfolioDescription: text("fabric_portfolio_description"),
  featuresTitle: varchar("features_title", { length: 255 }),
  featuresDescription: text("features_description"),
  callToActionTitle: varchar("call_to_action_title", { length: 255 }),
  callToActionDescription: text("call_to_action_description"),
  callToActionButtonText: varchar("call_to_action_button_text", {
    length: 100,
  }),
  callToActionButtonLink: varchar("call_to_action_button_link", {
    length: 255,
  }),
  buttonText: varchar("button_text", { length: 100 }), // Generic button text
  buttonLink: varchar("button_link", { length: 255 }), // Generic button link
  backgroundImageId: integer("background_image_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }), // Background image

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
});

// Types
export type SustainabilityHero = typeof sustainabilityHero.$inferSelect;
export type InsertSustainabilityHero = typeof sustainabilityHero.$inferInsert;

export type SustainabilityMetric = typeof sustainabilityMetrics.$inferSelect;
export type InsertSustainabilityMetric = typeof sustainabilityMetrics.$inferInsert;

export type SustainabilityInitiative = typeof sustainabilityInitiatives.$inferSelect;
export type InsertSustainabilityInitiative = typeof sustainabilityInitiatives.$inferInsert;

export type SustainabilityGoal = typeof sustainabilityGoals.$inferSelect;
export type InsertSustainabilityGoal = typeof sustainabilityGoals.$inferInsert;

export type SustainabilityFeatures = typeof sustainabilityFeatures.$inferSelect;
export type InsertSustainabilityFeatures = typeof sustainabilityFeatures.$inferInsert;

export type UnifiedSustainability = typeof unifiedSustainability.$inferSelect;
export type InsertUnifiedSustainability = typeof unifiedSustainability.$inferInsert;

// Zod Schemas
export const insertHomepageSustainabilitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),

  // Additional fields to match frontend expectations
  highlightedFeatures: z.array(z.string()).optional(),
  statistics: z
    .object({
      recycledMaterials: z.number(),
      carbonReduction: z.number(),
      renewableEnergy: z.number(),
      waterSaved: z.number(),
    })
    .optional(),
  impactMetrics: z
    .object({
      waterSavedPerProduct: z.number(),
      chemicalsReduced: z.number(),
    })
    .optional(),
  certifications: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),

  isActive: z.boolean().optional(),
});

export const insertSustainabilityCallToActionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  backgroundImageId: z.number().optional(),
});

export const insertSustainabilitySectionHeadersSchema = z.object({
  metricsTitle: z.string().optional(),
  metricsDescription: z.string().optional(),
  certificationsTitle: z.string().optional(),
  certificationsDescription: z.string().optional(),
  initiativesTitle: z.string().optional(),
  initiativesDescription: z.string().optional(),
  goalsTitle: z.string().optional(),
  goalsDescription: z.string().optional(),
  fabricPortfolioTitle: z.string().optional(),
  fabricPortfolioDescription: z.string().optional(),
  featuresTitle: z.string().optional(),
  featuresDescription: z.string().optional(),
});

// Export inferred types
export type SustainabilityCallToAction = z.infer<typeof insertSustainabilityCallToActionSchema>;
export type SustainabilitySectionHeaders = z.infer<typeof insertSustainabilitySectionHeadersSchema>;

export const insertSustainabilityHeroSchema = createInsertSchema(sustainabilityHero);
export const selectSustainabilityHeroSchema = createSelectSchema(sustainabilityHero);

export const insertSustainabilityMetricSchema = createInsertSchema(sustainabilityMetrics);
export const selectSustainabilityMetricSchema = createSelectSchema(sustainabilityMetrics);

export const insertSustainabilityInitiativeSchema = createInsertSchema(sustainabilityInitiatives);
export const selectSustainabilityInitiativeSchema = createSelectSchema(sustainabilityInitiatives);

export const insertSustainabilityGoalSchema = createInsertSchema(sustainabilityGoals);
export const selectSustainabilityGoalSchema = createSelectSchema(sustainabilityGoals);

export const insertSustainabilityFeaturesSchema = createInsertSchema(sustainabilityFeatures);
export const selectSustainabilityFeaturesSchema = createSelectSchema(sustainabilityFeatures);

export const insertUnifiedSustainabilitySchema = createInsertSchema(unifiedSustainability);
export const selectUnifiedSustainabilitySchema = createSelectSchema(unifiedSustainability);
