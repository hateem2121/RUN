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
    name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 100 }).default("sustainability"), // Categorical: sustainability, compliance, quality, safety, environmental
    issuingOrganization: varchar({ length: 255 }),
    description: text(),
    certificateNumber: varchar({ length: 100 }),
    issueDate: timestamp({ mode: "date", precision: 3 }),
    expiryDate: timestamp({ mode: "date", precision: 3 }),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    documentId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Frontend compatibility: URL and naming aliases
    issuingBody: varchar({ length: 255 }), // Alias for issuingOrganization
    documentUrl: varchar({ length: 500 }), // URL alias for documentId
    imageUrl: varchar({ length: 500 }), // URL alias for imageId

    status: varchar({ length: 50 }).default("active"),
    showOnSustainabilityPage: boolean().default(false), // Missing property causing errors
    isActive: boolean().default(true),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),

    // Soft delete support
    deletedAt: timestamp({ mode: "date", precision: 3 }),
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
    name: varchar({ length: 255 }).notNull(),
    description: text(), // Chart description for admin UI
    category: varchar({ length: 100 }),
    gender: varchar({ length: 20 }),
    type: varchar({ length: 100 }), // Frontend expects chart type
    region: varchar({ length: 100 }), // Regional sizing standards (US, EU, UK, etc.)
    measurements: jsonb().$type<Record<string, unknown>>(),
    sizeRange: jsonb().$type<string[]>(),
    unit: varchar({ length: 10 }).default("cm"),
    fitNotes: text(), // Fit guidance and notes
    imageId: integer().references(() => mediaAssets.id, {
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
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    category: varchar({ length: 100 }),
    type: varchar({ length: 100 }), // Frontend expects accessory type
    material: varchar({ length: 255 }),
    color: varchar({ length: 100 }),
    size: varchar({ length: 100 }),
    sku: varchar({ length: 100 }),
    price: decimal({ precision: 10, scale: 2 }),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    specifications: jsonb().$type<Record<string, unknown>>(),
    isActive: boolean().default(true),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
    updatedAt: timestamp({
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

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Types
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

export type SizeChart = typeof sizeCharts.$inferSelect;
export type InsertSizeChart = typeof sizeCharts.$inferInsert;

export type Accessory = typeof accessories.$inferSelect;
export type InsertAccessory = typeof accessories.$inferInsert;

// Zod Schemas
export const selectCertificateSchema = createSelectSchema(certificates);
export const insertCertificateSchema = createInsertSchema(certificates, {
  name: (s) => s.min(1),
  issueDate: z.date().or(z.string()).nullable().optional(),
  expiryDate: z.date().or(z.string()).nullable().optional(),
});

export const selectSizeChartSchema = createSelectSchema(sizeCharts);
export const insertSizeChartSchema = createInsertSchema(sizeCharts, {
  name: (s) => s.min(1),
});

export const selectAccessorySchema = createSelectSchema(accessories);
export const insertAccessorySchema = createInsertSchema(accessories, {
  name: (s) => s.min(1),
});
