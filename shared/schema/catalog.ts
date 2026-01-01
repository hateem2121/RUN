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

// Certificates
export const certificates = pgTable(
  "certificates",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).default("sustainability"), // Categorical: sustainability, compliance, quality, safety, environmental
    issuingOrganization: varchar("issuing_organization", { length: 255 }),
    description: text("description"),
    certificateNumber: varchar("certificate_number", { length: 100 }),
    issueDate: timestamp("issue_date", { mode: "date", precision: 3 }),
    expiryDate: timestamp("expiry_date", { mode: "date", precision: 3 }),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    documentId: integer("document_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Frontend compatibility: URL and naming aliases
    issuingBody: varchar("issuing_body", { length: 255 }), // Alias for issuingOrganization
    documentUrl: varchar("document_url", { length: 500 }), // URL alias for documentId
    imageUrl: varchar("image_url", { length: 500 }), // URL alias for imageId

    status: varchar("status", { length: 50 }).default("active"),
    showOnSustainabilityPage: boolean("show_on_sustainability_page").default(false), // Missing property causing errors
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for certificate queries
    index("certificates_show_on_sustainability_idx").on(table.showOnSustainabilityPage),
    index("certificates_is_active_idx").on(table.isActive),
  ],
);

// Size Charts
export const sizeCharts = pgTable(
  "size_charts",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"), // Chart description for admin UI
    category: varchar("category", { length: 100 }),
    gender: varchar("gender", { length: 20 }),
    type: varchar("type", { length: 100 }), // Frontend expects chart type
    region: varchar("region", { length: 100 }), // Regional sizing standards (US, EU, UK, etc.)
    measurements: jsonb("measurements").$type<Record<string, any>>(),
    sizeRange: jsonb("size_range").$type<string[]>(),
    unit: varchar("unit", { length: 10 }).default("cm"),
    fitNotes: text("fit_notes"), // Fit guidance and notes
    imageId: integer("image_id").references(() => mediaAssets.id, {
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

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for size chart queries
    index("size_charts_is_active_idx").on(table.isActive),
    index("size_charts_deleted_at_idx").on(table.deletedAt),
    index("size_charts_active_query_idx").on(table.isActive, table.deletedAt),
  ],
);

// Accessories
export const accessories = pgTable(
  "accessories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    type: varchar("type", { length: 100 }), // Frontend expects accessory type
    material: varchar("material", { length: 255 }),
    color: varchar("color", { length: 100 }),
    size: varchar("size", { length: 100 }),
    sku: varchar("sku", { length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    specifications: jsonb("specifications").$type<Record<string, any>>(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    // PERFORMANCE INDEXES for accessory queries
    index("accessories_sku_idx").on(table.sku),
    index("accessories_is_active_idx").on(table.isActive),
  ],
);

// Types
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

export type SizeChart = typeof sizeCharts.$inferSelect;
export type InsertSizeChart = typeof sizeCharts.$inferInsert;

export type Accessory = typeof accessories.$inferSelect;
export type InsertAccessory = typeof accessories.$inferInsert;

// Zod Schemas
export const insertCertificateSchema = z.object({
  name: z.string().min(1),
  type: z.string().nullable().optional(),
  issuingOrganization: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  certificateNumber: z.string().nullable().optional(),
  issueDate: z.date().or(z.string()).nullable().optional(),
  expiryDate: z.date().or(z.string()).nullable().optional(),
  imageId: z.number().int().nullable().optional(),
  documentId: z.number().int().nullable().optional(),
  issuingBody: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const insertSizeChartSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  type: z.string().optional(),
  region: z.string().optional(),
  measurements: z.record(z.string(), z.any()).optional(),
  sizeRange: z.array(z.string()).optional(),
  unit: z.string().optional(),
  fitNotes: z.string().optional(),
  imageId: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const insertAccessorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().or(z.string()).optional(),
  imageId: z.number().int().optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});
