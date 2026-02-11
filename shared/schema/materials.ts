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
import { pgTable } from "./common.js";
import { mediaAssets } from "./media.js";

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

    // Properties - Stores structured technical data including:
    // - compositions: Array<{name, isDefault, fibers: Array<{fiberId, percentage}>}>
    // - Performance: stretchPercentage, enhancedMoistureManagement, wickingRate, dryingTime, performanceFeatures[], airPermeability, waterColumn
    // - Durability: colorfastness, tensileStrength, tearStrength, abrasionResistance, pillingGrade, shrinkageTolerancePercentage, washTemperature, yarnCountConstruction
    // - Care: washCareInstructions {careSymbols[], instructions, restrictions[]}
    // - Sustainability: endOfLifeOptions[]
    properties: jsonb().$type<Record<string, any>>(),
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
    properties: jsonb().$type<Record<string, any>>(),

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
export const fabricCompositions = pgTable("fabric_compositions", {
  id: serial("id").primaryKey(),
  fabricId: integer().references(() => fabrics.id),
  fiberId: integer().references(() => fibers.id),
  percentage: decimal(),
});

// Types
export type Fabric = typeof fabrics.$inferSelect;
export type InsertFabric = typeof fabrics.$inferInsert;

export type Fiber = typeof fibers.$inferSelect;
export type InsertFiber = typeof fibers.$inferInsert;

// Zod Schemas
export const insertFabricSchema = z.object({
  // Basic Fields
  name: z.string().min(1),
  description: z.string().optional(),
  fabricType: z.string().optional(),

  // PRODUCT ESSENCE - B2B Core Fields
  sport: z.string().optional(),
  marketSegment: z.string().optional(),
  seasonality: z.string().optional(),

  weight: z.string().optional(),
  /**
   * @deprecated Use `compositions` array instead for structured fiber composition data
   * @since 2024-09 - Field removed from database schema, kept in Zod for backward compatibility
   * @remove 2026-03 - Will be removed after 6-month grace period with zero usage
   * @description Legacy string field for fabric composition. Server-side mapping converts this to compositions array.
   *              New integrations should use the structured `compositions` array field.
   */
  composition: z.string().optional(),
  weave: z.string().optional(),
  weaveType: z.string().optional(),
  weaveTypes: z.array(z.string()).optional(),
  stretch: z.string().optional(),
  finishTreatment: z.string().optional(),
  finish: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  careInstructions: z.string().optional(),
  sustainabilityScore: z.union([z.number().int(), z.string()]).optional(),
  certificateIds: z.array(z.number()).optional(),
  visualSwatchId: z.number().int().optional(),
  keyApplications: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),

  // Fiber Compositions (multiple compositions, each can be 100%)
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

  // Performance & Technical Fields
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

  // Durability & Quality Fields
  yarnCountConstruction: z.string().optional(),
  colorfastness: z.string().optional(), // NEW: Color fastness rating
  tensileStrength: z.string().optional(), // NEW: Tensile strength measurement
  tearStrength: z.string().optional(), // NEW: Tear strength measurement
  abrasionResistance: z.string().optional(),
  pillingGrade: z.string().optional(),
  shrinkageTolerancePercentage: z.string().optional(),
  washTemperature: z.string().optional(),

  // Sustainability & Lifecycle Fields
  certificationTags: z.array(z.number()).optional(),
  certificationIds: z.array(z.number()).optional(),
  endOfLifeOptions: z.array(z.string()).optional(),
  recyclabilityNotes: z.string().optional(),

  // Use Cases & Applications
  useCases: z.array(z.string()).optional(),
  finishTreatments: z.array(z.string()).optional(),

  // Care Instructions (structured)
  washCareInstructions: z
    .object({
      careSymbols: z.array(z.string()).optional(),
      instructions: z.string().optional(),
      restrictions: z.array(z.string()).optional(),
    })
    .optional(),
});

export const insertFiberSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1), // REQUIRED: matches database schema
  description: z.string().optional(),
  sustainabilityScore: z.number().int().optional(),
  environmentalImpact: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
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
