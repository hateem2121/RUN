import { sql } from "drizzle-orm";
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
import { z } from "zod";
import { pgTable } from "./common";
import { mediaAssets } from "./media";

export interface FiberComposition {
  fiberId: number | null;
  percentage: string;
}

export interface CompositionSet {
  name: string;
  isDefault: boolean;
  fibers: FiberComposition[];
}

export interface FabricProperties {
  compositions?: CompositionSet[];
  moistureManagement?: string;
  wickingRate?: string;
  dryingTime?: string;
  airPermeability?: string | number;
  waterColumn?: string | number;
  enhancedMoistureManagement?: string;
  yarnCountConstruction?: string;
  colorfastness?: string;
  tensileStrength?: string;
  tearStrength?: string;
  abrasionResistance?: string | number;
  pillingGrade?: string | number;
  shrinkageTolerancePercentage?: string | number;
  washTemperature?: string;
  breathability?: string | number;
  stretchPercentage?: string | number;
  stretchDirection?: string[];
  performanceFeatures?: string[];
  keyApplications?: string[];
  finish?: string;
  finishTreatments?: string[];
  certificationIds?: number[];
  certificationTags?: string[];
  endOfLifeOptions?: string[];
  recyclabilityNotes?: string;
  useCases?: string[];
  washCareInstructions?: {
    careSymbols: string[];
    instructions: string;
    restrictions: string[];
  };
  composition?: string; // Legacy field
  [key: string]: unknown;
}

export interface FiberProperties {
  environmentalImpact?: string;
  [key: string]: unknown;
}

// Fabrics
export const fabrics = pgTable(
  "fabrics",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    fabricType: varchar({ length: 100 }),

    // PRODUCT ESSENCE - B2B Core Fields
    sport: text(), // Sport category (Running, Cycling, Training, etc.)
    marketSegment: text("market_segment"), // Market segment (Premium, Performance, Mass Market, etc.)
    seasonality: text(), // Seasonal use (All-Season, Summer, Winter, Spring/Fall)

    // Technical specifications
    weight: varchar({ length: 50 }),
    weave: varchar({ length: 100 }),
    weaveType: varchar({ length: 100 }), // Weave type alias for compatibility
    weaveTypes: jsonb().$type<string[]>(), // Array of weave types
    stretch: varchar({ length: 50 }),
    finishTreatment: varchar({ length: 255 }), // Fabric finishing treatment

    // Properties - Stores structured technical data
    properties: jsonb().$type<FabricProperties>(),
    careInstructions: text(),

    // Sustainability
    sustainabilityScore: integer(),
    certifications: jsonb().$type<string[]>(),

    // Visual and application fields
    visualSwatchId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }), // Visual swatch media
    keyApplications: jsonb().$type<string[]>(), // Key applications/uses for this fabric

    isActive: boolean().default(true),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp({ mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for fabric queries
    index("fabrics_is_active_idx").on(table.isActive),
    index("fabrics_fabric_type_idx").on(table.fabricType),
    index("fabrics_sport_idx").on(table.sport),
    index("fabrics_seasonality_idx").on(table.seasonality),
    index("fabrics_deleted_at_idx").on(table.deletedAt),
    index("fabrics_active_query_idx").on(table.deletedAt, table.isActive),
    // CONSOLIDATED OPTIMIZATIONS (DS-007): Trigram index for ILIKE search
    index("fabrics_name_trgm_idx").using("gin", sql`${table.name} gin_trgm_ops`),
  ],
);

// Fibers (base materials)
export const fibers = pgTable(
  "fibers",
  {
    id: serial("id").primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 100 }).notNull(), // Required type field for fabrics
    description: text(),

    // Business fields
    sustainabilityScore: integer(),
    environmentalImpact: text(),
    properties: jsonb().$type<FiberProperties>(),

    isActive: boolean().default(true),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp({ mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for fiber queries
    index("fibers_type_idx").on(table.type),
    index("fibers_is_active_idx").on(table.isActive),
    index("fibers_deleted_at_idx").on(table.deletedAt),
  ],
);

// Fabric Compositions stub (for relationship queries)
export const fabricCompositions = pgTable(
  "fabric_compositions",
  {
    id: serial("id").primaryKey(),
    fabricId: integer().references(() => fabrics.id, { onDelete: "cascade" }),
    fiberId: integer().references(() => fibers.id, { onDelete: "cascade" }),
    percentage: decimal(),
  },
  (table) => [
    index("fabric_compositions_fabric_id_idx").on(table.fabricId),
    index("fabric_compositions_fiber_id_idx").on(table.fiberId),
  ],
);

// Types
export type Fabric = typeof fabrics.$inferSelect;
export type InsertFabric = typeof fabrics.$inferInsert;

export type Fiber = typeof fibers.$inferSelect;
export type InsertFiber = typeof fibers.$inferInsert;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Zod Schemas
export const selectFabricSchema = createSelectSchema(fabrics);
export const selectFiberSchema = createSelectSchema(fibers);

export const insertFabricSchema = createInsertSchema(fabrics, {
  name: (s) => s.min(1),
  sustainabilityScore: z.union([z.number().int(), z.string()]).optional(),
}).extend({
  /**
   * @deprecated Use `compositions` array instead for structured fiber composition data
   */
  composition: z.string().optional(),
  finish: z.string().optional(),
  certificateIds: z.array(z.number()).optional(),
  compositions: z
    .array(
      z.object({
        name: z.string(),
        isDefault: z.boolean(),
        fibers: z.array(
          z.object({
            fiberId: z.union([z.number(), z.null()]),
            percentage: z.string(),
          }),
        ),
      }),
    )
    .optional(),
  stretchDirection: z.array(z.string()).optional(),
  stretchPercentage: z.string().optional(),
  breathability: z.string().optional(),
  moistureManagement: z.string().optional(),
  enhancedMoistureManagement: z.string().optional(),
  wickingRate: z.string().optional(),
  dryingTime: z.string().optional(),
  airPermeability: z.string().optional(),
  waterColumn: z.string().optional(),
  performanceFeatures: z.array(z.string()).optional(),
  yarnCountConstruction: z.string().optional(),
  colorfastness: z.string().optional(),
  tensileStrength: z.string().optional(),
  tearStrength: z.string().optional(),
  abrasionResistance: z.string().optional(),
  pillingGrade: z.string().optional(),
  shrinkageTolerancePercentage: z.string().optional(),
  washTemperature: z.string().optional(),
  certificationTags: z.array(z.number()).optional(),
  certificationIds: z.array(z.number()).optional(),
  endOfLifeOptions: z.array(z.string()).optional(),
  recyclabilityNotes: z.string().optional(),
  useCases: z.array(z.string()).optional(),
  finishTreatments: z.array(z.string()).optional(),
  washCareInstructions: z
    .object({
      careSymbols: z.array(z.string()).optional(),
      instructions: z.string().optional(),
      restrictions: z.array(z.string()).optional(),
    })
    .optional(),
});

export const insertFiberSchema = createInsertSchema(fibers, {
  name: (s) => s.min(1),
  type: (s) => s.min(1),
});

// Additional Sustainability Types (from Zod schemas)
export const insertSustainabilityFabricPortfolioSchema = z.object({
  // Add actual schema definition here if present in original/zod-schemas.ts
  // Assuming it's a complex type logic, placeholder for now or import if exists
});

// Exporting placeholder types until we clarify if they belonged to sustainability.ts or here
// Based on file analysis, these were just Type exports from Zod inference
export type SustainabilityFabricPortfolio = z.infer<
  typeof insertSustainabilityFabricPortfolioSchema
>;
