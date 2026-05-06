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
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    description: text(),
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
    name: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 100 }).notNull(),
    unit: varchar({ length: 50 }),
    description: text(),
    category: varchar({ length: 100 }),
    iconName: varchar({ length: 100 }),

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
    index("sustainability_metrics_is_active_idx").on(table.isActive),
    index("sustainability_metrics_sort_order_idx").on(table.sortOrder),
  ],
);

// Sustainability Metric History - Tracks changes over time
export const sustainabilityMetricHistory = pgTable(
  "sustainability_metric_history",
  {
    id: serial("id").primaryKey(),
    metricId: integer("metric_id")
      .notNull()
      .references(() => sustainabilityMetrics.id, { onDelete: "cascade" }),
    value: varchar({ length: 100 }).notNull(),
    recordedAt: timestamp("recorded_at", { mode: "date", precision: 3 }).defaultNow(),
    recordedBy: integer("recorded_by"), // Reference to admin user id
    notes: text(),
  },
  (table) => [index("metric_history_metric_id_idx").on(table.metricId)],
);

// Sustainability Initiatives
export const sustainabilityInitiatives = pgTable(
  "sustainability_initiatives",
  {
    id: serial("id").primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    impact: text(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Frontend compatibility: Additional categorization fields
    iconName: varchar({ length: 50 }),
    category: varchar({ length: 100 }),
    highlightedFeatures: jsonb().$type<string[]>(), // Key features to highlight

    status: varchar({ length: 50 }).default("active"),
    startDate: timestamp("start_date", { mode: "date", precision: 3 }),
    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
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
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    target: varchar({ length: 255 }),
    currentProgress: decimal({ precision: 5, scale: 2 }),

    // Frontend compatibility: Numeric values for progress tracking
    currentValue: decimal({ precision: 10, scale: 2 }),
    targetValue: decimal({ precision: 10, scale: 2 }),
    targetYear: integer(),
    unit: varchar({ length: 50 }), // Unit for currentValue/targetValue

    targetDate: timestamp("target_date", { mode: "date", precision: 3 }),
    category: varchar({ length: 100 }),
    priority: varchar({ length: 20 }).default("medium"),
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
    index("sustainability_goals_is_active_idx").on(table.isActive),
    index("sustainability_goals_sort_order_idx").on(table.sortOrder),
  ],
);

// Additional entities from research (unified sustainability, features, etc.)
export const sustainabilityFeatures = pgTable("sustainability_features", {
  id: serial("id").primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  category: varchar({ length: 100 }),
  impact: text(),
  imageId: integer().references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  metrics: jsonb().$type<Record<string, unknown>>(),
  highlightedFeatures: jsonb().$type<Array<{ title: string; description: string }>>(), // Key features to highlight
  isActive: boolean().default(true),
  sortOrder: integer().default(0),
  createdAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

export const unifiedSustainability = pgTable("unified_sustainability", {
  id: serial("id").primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  headline: varchar({ length: 255 }), // Frontend display headline
  subheadline: text(), // Frontend display subheadline
  content: text(),
  sectionType: varchar({ length: 100 }).notNull(),
  data: jsonb().$type<Record<string, unknown>>(),
  // REMOVED: metrics JSONB column (use sustainability_metrics table instead)
  ctaText: varchar({ length: 100 }), // Call-to-action button text
  ctaLink: varchar({ length: 255 }), // Call-to-action button link

  // Section-specific titles and descriptions
  metricsTitle: varchar({ length: 255 }),
  metricsDescription: text(),
  certificationsTitle: varchar({ length: 255 }),
  certificationsDescription: text(),
  certificationsFooterNote: text(),
  certificationIds: jsonb().$type<number[]>(), // Array of certification IDs
  initiativesTitle: varchar({ length: 255 }),
  initiativesDescription: text(),
  goalsTitle: varchar({ length: 255 }),
  goalsDescription: text(),
  fabricPortfolioTitle: varchar({ length: 255 }),
  fabricPortfolioDescription: text(),
  featuresTitle: varchar({ length: 255 }),
  featuresDescription: text(),
  callToActionTitle: varchar({ length: 255 }),
  callToActionDescription: text(),
  callToActionButtonText: varchar({
    length: 100,
  }),
  callToActionButtonLink: varchar({
    length: 255,
  }),
  buttonText: varchar({ length: 100 }), // Generic button text
  buttonLink: varchar({ length: 255 }), // Generic button link
  backgroundImageId: integer().references(() => mediaAssets.id, {
    onDelete: "set null",
  }), // Background image

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

export type SustainabilityMetricHistory = typeof sustainabilityMetricHistory.$inferSelect;
export type InsertSustainabilityMetricHistory = typeof sustainabilityMetricHistory.$inferInsert;

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

export type HomepageSustainability = z.infer<typeof insertHomepageSustainabilitySchema>;
export type InsertHomepageSustainability = z.infer<typeof insertHomepageSustainabilitySchema>;

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

export const insertSustainabilityMetricHistorySchema = createInsertSchema(
  sustainabilityMetricHistory,
);
export const selectSustainabilityMetricHistorySchema = createSelectSchema(
  sustainabilityMetricHistory,
);

export const insertUnifiedSustainabilitySchema = createInsertSchema(unifiedSustainability);
export const selectUnifiedSustainabilitySchema = createSelectSchema(unifiedSustainability);

// Admin sustainability metric form validation schema
export const sustainabilityMetricFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  metric: z.string().min(3, "Metric name must be at least 3 characters"),
  value: z
    .string()
    .min(1, "Value is required")
    .refine((val) => !Number.isNaN(Number(val)), "Value must be a number"),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().default("Leaf"),
  isActive: z.boolean().default(true),
  position: z.number().int().min(1).default(1),
});
export type SustainabilityMetricFormData = z.infer<typeof sustainabilityMetricFormSchema>;
