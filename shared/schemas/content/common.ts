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
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { pgTable } from "../common";
import { mediaAssets } from "../media";

// Navigation Items - Enhanced for floating dock navigation
export const navigationItems = pgTable("navigation_items", {
  id: serial("id").primaryKey(),
  label: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }), // Alias for label (frontend compatibility)
  title: varchar({ length: 255 }), // Frontend display title (alias for label)
  url: varchar({ length: 255 }),
  href: varchar({ length: 255 }), // Alias for url (frontend compatibility)
  path: varchar({ length: 255 }), // Path alias (frontend compatibility)
  iconName: varchar({ length: 100 }),

  // Enhanced icon system (optional future expansion)
  iconType: varchar({ length: 20 }).default("fallback"), // 'media' | 'fallback'
  iconSize: varchar({ length: 20 }).default("medium"), // 'small' | 'medium' | 'large'
  fallbackIcon: varchar({ length: 100 }).default("IconHome"), // Tabler icon name
  mediaIconId: integer().references(() => mediaAssets.id, {
    onDelete: "set null",
  }),

  // Hierarchical navigation
  parentId: integer(),
  level: integer().default(0),

  // Display settings
  showOnDesktop: boolean().default(true),
  showOnMobile: boolean().default(true),

  // Behavior settings
  isExternal: boolean().default(false),
  target: varchar({ length: 20 }).default("_self"),
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

  // Soft delete support
  deletedAt: timestamp({ mode: "date", precision: 3 }),
});

// Contact Page Configuration
export const contactPageConfigurations = pgTable("contact_page_configurations", {
  id: serial("id").primaryKey(),
  title: varchar({ length: 255 }),
  heroTitle: varchar({ length: 255 }), // Frontend expects heroTitle
  description: text(),
  address: text(),
  phone: varchar({ length: 50 }),
  email: varchar({ length: 255 }),
  workingHours: text(),
  mapCoordinates: jsonb().$type<{
    lat: number;
    lng: number;
  }>(),
  socialLinks: jsonb().$type<Record<string, string>>(),

  // New Contact Page Fields for Enhanced UI
  locationLine1: text(),
  locationLine2: text(),
  locationButtonText: varchar({
    length: 100,
  }).default("GET DIRECTIONS"),
  tradingHours: jsonb().$type<Array<{ label: string; value: string }>>(),
  platformOptions: jsonb()
    .$type<string[]>()
    .default(sql`'["Phone Call", "WhatsApp", "WeChat", "Telegram", "Other"]'::jsonb`),
  formButtonText: varchar({ length: 255 }).default("Get a Response Within 24 Hours"),
  formPrivacyText: text().default("We value your privacy and will never share your information."),
  successHeading: varchar({ length: 255 }).default("Thank you!"),
  successMessage: text().default("We've received your message and will be in touch shortly."),

  // Admin UI Control Fields - Contact Page Settings
  contactInfoTitle: varchar({ length: 255 }),
  contactInfoSubtitle: text(),
  showContactInfo: boolean().default(true),
  showBusinessHours: boolean().default(true),
  showLocationMap: boolean().default(true),
  heroBackgroundStyle: varchar({
    length: 100,
  }).default("gradient"),
  heroBackgroundColor: varchar({ length: 50 }),
  contactCardsLayout: varchar({ length: 50 }).default("grid"),
  showFormInSeparateSection: boolean().default(false),
  formBackgroundStyle: varchar({
    length: 100,
  }).default("default"),
  metaTitle: varchar({ length: 255 }),

  isActive: boolean().default(true),
  createdAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Contact Inquiries - Customer inquiry/contact form submissions
export const inquiries = pgTable(
  "inquiries",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Contact information
    name: varchar({ length: 255 }).notNull(), // Encrypted (AES-256-GCM)
    email: varchar({ length: 500 }).notNull(), // Encrypted
    emailIndex: varchar({ length: 255 }), // Blind Index (HMAC-SHA256)
    company: varchar({ length: 255 }), // Encrypted
    phone: varchar({ length: 255 }), // Encrypted
    country: varchar({ length: 100 }),

    // Form data
    preferredPlatform: varchar({ length: 50 }),
    message: text().notNull(), // Encrypted

    // Metadata
    source: varchar({ length: 50 }).default("contact-page").notNull(),
    status: varchar({ length: 20 }).default("new").notNull(),

    // Timestamps
    submittedAt: timestamp({ mode: "date", precision: 3 }).defaultNow().notNull(),
    respondedAt: timestamp({ mode: "date", precision: 3 }),

    // Admin fields
    adminNotes: text("admin_notes"),
    assignedTo: varchar("assigned_to", { length: 100 }),

    // CRM Enhancement Fields
    priority: varchar({ length: 20 }).default("medium").notNull(),
    crmStage: varchar("crm_stage", { length: 50 }).default("lead").notNull(),
    crmLogs: jsonb("crm_logs")
      .$type<
        Array<{
          date: string;
          action: string;
          note: string;
          user?: string;
        }>
      >()
      .default([])
      .notNull(),
    leadScore: integer("lead_score").default(0).notNull(),
    tags: jsonb().$type<string[]>().default([]).notNull(),
  },
  (table) => [
    // Performance indexes
    index("inquiries_status_idx").on(table.status),
    index("inquiries_submitted_at_idx").on(table.submittedAt.desc()),
    index("inquiries_email_index_idx").on(table.emailIndex),
    index("inquiries_source_idx").on(table.source),
    // Composite index for admin filtering (status + submittedAt)
    index("inquiries_status_submitted_idx").on(table.status, table.submittedAt.desc()),
  ],
);

// Footer Configuration
export const footerConfiguration = pgTable("footer_configuration", {
  id: serial("id").primaryKey(),

  // General Settings
  contactFormHeading: varchar({ length: 500 }).default("GET IN TOUCH WITH RUN APPAREL").notNull(),
  contactFormEnabled: boolean().default(true).notNull(),

  // Navigation & Links
  navigationColumns: jsonb()
    .$type<
      Array<{
        title: string;
        links: Array<{ label: string; href: string; external?: boolean }>;
      }>
    >()
    .notNull()
    .default(sql`'[]'::jsonb`),

  socialLinks: jsonb()
    .$type<
      Array<{
        name: string;
        icon: string;
        href: string;
        hoverColor: string;
      }>
    >()
    .notNull()
    .default(sql`'[]'::jsonb`),

  legalLinks: jsonb()
    .$type<Array<{ label: string; href: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),

  // Certificates
  certificateIds: jsonb().$type<number[]>().notNull().default(sql`'[]'::jsonb`),

  // Company Info
  companyName: varchar({ length: 255 }).notNull().default(""),
  companyAddress: text().notNull().default(""),
  companyPhone: varchar({ length: 50 }).notNull().default(""),
  companyEmail: varchar({ length: 255 }).notNull().default(""),

  // Branding
  brandText: varchar({ length: 255 }).notNull().default(""),
  brandTagline: varchar({ length: 255 }).notNull().default(""),
  brandSubtext: varchar({ length: 255 }).notNull().default(""),

  // SEO
  structuredData: jsonb().$type<Record<string, any>>(),

  isActive: boolean().default(true),
  createdAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Navigation Glassmorphism Settings
export const navigationGlassmorphismSettings = pgTable("navigation_glassmorphism_settings", {
  id: serial("id").primaryKey(),
  opacity: decimal({ precision: 3, scale: 2 }).default("0.8"),
  blur: integer().default(10),
  borderRadius: integer().default(12),
  backdropFilter: varchar({ length: 100 }).default("blur(10px)"),
  backgroundColor: varchar({ length: 50 }).default("rgba(255,255,255,0.1)"),
  borderColor: varchar({ length: 50 }).default("rgba(255,255,255,0.2)"),

  // Admin UI Advanced Glassmorphism Controls
  backgroundOpacity: decimal({
    precision: 3,
    scale: 2,
  }).default("0.8"),
  blurStrength: integer().default(10),
  borderOpacity: decimal({
    precision: 3,
    scale: 2,
  }).default("0.2"),
  shadowIntensity: decimal({
    precision: 3,
    scale: 2,
  }).default("0.1"),
  topHighlightOpacity: decimal({
    precision: 3,
    scale: 2,
  }).default("0.5"),
  leftHighlightOpacity: decimal({
    precision: 3,
    scale: 2,
  }).default("0.3"),
  innerShadowOpacity: decimal({
    precision: 3,
    scale: 2,
  }).default("0.5"), // Inner shadow opacity for glassmorphism
  enabled: boolean().default(true), // Frontend toggle for glassmorphism effects

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
});

// Types
export type NavigationItem = typeof navigationItems.$inferSelect;
export type InsertNavigationItem = typeof navigationItems.$inferInsert;

export type ContactPageConfiguration = typeof contactPageConfigurations.$inferSelect;
export type InsertContactPageConfiguration = typeof contactPageConfigurations.$inferInsert;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

export type FooterConfiguration = typeof footerConfiguration.$inferSelect;
export type InsertFooterConfiguration = typeof footerConfiguration.$inferInsert;

export type NavigationGlassmorphismSettings = typeof navigationGlassmorphismSettings.$inferSelect;
export type InsertNavigationGlassmorphismSettings =
  typeof navigationGlassmorphismSettings.$inferInsert;

// Zod Schemas
export const insertInquirySchema = createInsertSchema(inquiries);

export const insertFooterConfigurationSchema = createInsertSchema(footerConfiguration, {
  navigationColumns: (schema) => schema.nullable(),
  socialLinks: (schema) => schema.nullable(),
  legalLinks: (schema) => schema.nullable(),
  certificateIds: (schema) => schema.nullable(),
  structuredData: (schema) => schema.nullable(),
  isActive: (schema) => schema.default(true),
});

export const insertNavigationItemSchema = createInsertSchema(navigationItems);
export const selectNavigationItemSchema = createSelectSchema(navigationItems);

export const insertContactPageConfigurationSchema = createInsertSchema(contactPageConfigurations);
export const selectContactPageConfigurationSchema = createSelectSchema(contactPageConfigurations);

export const insertNavigationGlassmorphismSettingsSchema = createInsertSchema(
  navigationGlassmorphismSettings,
);
export const selectNavigationGlassmorphismSettingsSchema = createSelectSchema(
  navigationGlassmorphismSettings,
);
