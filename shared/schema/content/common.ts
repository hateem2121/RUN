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
  label: varchar("label", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }), // Alias for label (frontend compatibility)
  title: varchar("title", { length: 255 }), // Frontend display title (alias for label)
  url: varchar("url", { length: 255 }),
  href: varchar("href", { length: 255 }), // Alias for url (frontend compatibility)
  path: varchar("path", { length: 255 }), // Path alias (frontend compatibility)
  iconName: varchar("icon_name", { length: 100 }),

  // Enhanced icon system (optional future expansion)
  iconType: varchar("icon_type", { length: 20 }).default("fallback"), // 'media' | 'fallback'
  iconSize: varchar("icon_size", { length: 20 }).default("medium"), // 'small' | 'medium' | 'large'
  fallbackIcon: varchar("fallback_icon", { length: 100 }).default("IconHome"), // Tabler icon name
  mediaIconId: integer("media_icon_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),

  // Hierarchical navigation
  parentId: integer("parent_id"),
  level: integer("level").default(0),

  // Display settings
  showOnDesktop: boolean("show_on_desktop").default(true),
  showOnMobile: boolean("show_on_mobile").default(true),

  // Behavior settings
  isExternal: boolean("is_external").default(false),
  target: varchar("target", { length: 20 }).default("_self"),
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

  // Soft delete support
  deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
});

// Contact Page Configuration
export const contactPageConfigurations = pgTable(
  "contact_page_configurations",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }),
    heroTitle: varchar("hero_title", { length: 255 }), // Frontend expects heroTitle
    description: text("description"),
    address: text("address"),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    workingHours: text("working_hours"),
    mapCoordinates: jsonb("map_coordinates").$type<{
      lat: number;
      lng: number;
    }>(),
    socialLinks: jsonb("social_links").$type<Record<string, string>>(),

    // New Contact Page Fields for Enhanced UI
    locationLine1: text("location_line1"),
    locationLine2: text("location_line2"),
    locationButtonText: varchar("location_button_text", {
      length: 100,
    }).default("GET DIRECTIONS"),
    tradingHours:
      jsonb("trading_hours").$type<Array<{ label: string; value: string }>>(),
    platformOptions: jsonb("platform_options")
      .$type<string[]>()
      .default(
        sql`'["Phone Call", "WhatsApp", "WeChat", "Telegram", "Other"]'::jsonb`,
      ),
    formButtonText: varchar("form_button_text", { length: 255 }).default(
      "Get a Response Within 24 Hours",
    ),
    formPrivacyText: text("form_privacy_text").default(
      "We value your privacy and will never share your information.",
    ),
    successHeading: varchar("success_heading", { length: 255 }).default(
      "Thank you!",
    ),
    successMessage: text("success_message").default(
      "We've received your message and will be in touch shortly.",
    ),

    // Admin UI Control Fields - Contact Page Settings
    contactInfoTitle: varchar("contact_info_title", { length: 255 }),
    contactInfoSubtitle: text("contact_info_subtitle"),
    showContactInfo: boolean("show_contact_info").default(true),
    showBusinessHours: boolean("show_business_hours").default(true),
    showLocationMap: boolean("show_location_map").default(true),
    heroBackgroundStyle: varchar("hero_background_style", {
      length: 100,
    }).default("gradient"),
    heroBackgroundColor: varchar("hero_background_color", { length: 50 }),
    contactCardsLayout: varchar("contact_cards_layout", { length: 50 }).default(
      "grid",
    ),
    showFormInSeparateSection: boolean("show_form_in_separate_section").default(
      false,
    ),
    formBackgroundStyle: varchar("form_background_style", {
      length: 100,
    }).default("default"),
    metaTitle: varchar("meta_title", { length: 255 }),

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
);

// Contact Inquiries - Customer inquiry/contact form submissions
export const inquiries = pgTable(
  "inquiries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    // Contact information
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    company: varchar("company", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    country: varchar("country", { length: 100 }),

    // Form data
    preferredPlatform: varchar("preferred_platform", { length: 50 }),
    message: text("message").notNull(),

    // Metadata
    source: varchar("source", { length: 50 }).default("contact-page").notNull(),
    status: varchar("status", { length: 20 }).default("new").notNull(),

    // Timestamps
    submittedAt: timestamp("submitted_at", { mode: "date", precision: 3 })
      .defaultNow()
      .notNull(),
    respondedAt: timestamp("responded_at", { mode: "date", precision: 3 }),

    // Admin fields
    adminNotes: text("admin_notes"),
    assignedTo: varchar("assigned_to", { length: 100 }),
  },
  (table) => [
    // Performance indexes
    index("inquiries_status_idx").on(table.status),
    index("inquiries_submitted_at_idx").on(table.submittedAt.desc()),
    index("inquiries_email_idx").on(table.email),
    index("inquiries_source_idx").on(table.source),
    // Composite index for admin filtering (status + submittedAt)
    index("inquiries_status_submitted_idx").on(
      table.status,
      table.submittedAt.desc(),
    ),
  ],
);

// Footer Configuration
export const footerConfiguration = pgTable("footer_configuration", {
  id: serial("id").primaryKey(),

  // General Settings
  contactFormHeading: varchar("contact_form_heading", { length: 500 })
    .default("GET IN TOUCH WITH RUN APPAREL")
    .notNull(),
  contactFormEnabled: boolean("contact_form_enabled").default(true).notNull(),

  // Navigation & Links
  navigationColumns: jsonb("navigation_columns")
    .$type<
      Array<{
        title: string;
        links: Array<{ label: string; href: string; external?: boolean }>;
      }>
    >()
    .notNull()
    .default(sql`'[]'::jsonb`),

  socialLinks: jsonb("social_links")
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

  legalLinks: jsonb("legal_links")
    .$type<Array<{ label: string; href: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),

  // Certificates
  certificateIds: jsonb("certificate_ids")
    .$type<number[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),

  // Company Info
  companyName: varchar("company_name", { length: 255 }).notNull().default(""),
  companyAddress: text("company_address").notNull().default(""),
  companyPhone: varchar("company_phone", { length: 50 }).notNull().default(""),
  companyEmail: varchar("company_email", { length: 255 }).notNull().default(""),

  // Branding
  brandText: varchar("brand_text", { length: 255 }).notNull().default(""),
  brandTagline: varchar("brand_tagline", { length: 255 }).notNull().default(""),
  brandSubtext: varchar("brand_subtext", { length: 255 }).notNull().default(""),

  // SEO
  structuredData: jsonb("structured_data").$type<Record<string, any>>(),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Navigation Glassmorphism Settings
export const navigationGlassmorphismSettings = pgTable(
  "navigation_glassmorphism_settings",
  {
    id: serial("id").primaryKey(),
    opacity: decimal("opacity", { precision: 3, scale: 2 }).default("0.8"),
    blur: integer("blur").default(10),
    borderRadius: integer("border_radius").default(12),
    backdropFilter: varchar("backdrop_filter", { length: 100 }).default(
      "blur(10px)",
    ),
    backgroundColor: varchar("background_color", { length: 20 }).default(
      "rgba(255,255,255,0.1)",
    ),
    borderColor: varchar("border_color", { length: 20 }).default(
      "rgba(255,255,255,0.2)",
    ),

    // Admin UI Advanced Glassmorphism Controls
    backgroundOpacity: decimal("background_opacity", {
      precision: 3,
      scale: 2,
    }).default("0.8"),
    blurStrength: integer("blur_strength").default(10),
    borderOpacity: decimal("border_opacity", {
      precision: 3,
      scale: 2,
    }).default("0.2"),
    shadowIntensity: decimal("shadow_intensity", {
      precision: 3,
      scale: 2,
    }).default("0.1"),
    topHighlightOpacity: decimal("top_highlight_opacity", {
      precision: 3,
      scale: 2,
    }).default("0.5"),
    leftHighlightOpacity: decimal("left_highlight_opacity", {
      precision: 3,
      scale: 2,
    }).default("0.3"),
    innerShadowOpacity: decimal("inner_shadow_opacity", {
      precision: 3,
      scale: 2,
    }).default("0.5"), // Inner shadow opacity for glassmorphism
    enabled: boolean("enabled").default(true), // Frontend toggle for glassmorphism effects

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
);

// Types
export type NavigationItem = typeof navigationItems.$inferSelect;
export type InsertNavigationItem = typeof navigationItems.$inferInsert;

export type ContactPageConfiguration =
  typeof contactPageConfigurations.$inferSelect;
export type InsertContactPageConfiguration =
  typeof contactPageConfigurations.$inferInsert;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

export type FooterConfiguration = typeof footerConfiguration.$inferSelect;
export type InsertFooterConfiguration = typeof footerConfiguration.$inferInsert;

export type NavigationGlassmorphismSettings =
  typeof navigationGlassmorphismSettings.$inferSelect;
export type InsertNavigationGlassmorphismSettings =
  typeof navigationGlassmorphismSettings.$inferInsert;

// Zod Schemas
export const insertInquirySchema = createInsertSchema(inquiries);

export const insertFooterConfigurationSchema = createInsertSchema(
  footerConfiguration,
  {
    navigationColumns: (schema) => schema.nullable(),
    socialLinks: (schema) => schema.nullable(),
    legalLinks: (schema) => schema.nullable(),
    certificateIds: (schema) => schema.nullable(),
    structuredData: (schema) => schema.nullable(),
    isActive: (schema) => schema.default(true),
  },
);

export const insertNavigationItemSchema = createInsertSchema(navigationItems);
export const selectNavigationItemSchema = createSelectSchema(navigationItems);

export const insertContactPageConfigurationSchema = createInsertSchema(
  contactPageConfigurations,
);
export const selectContactPageConfigurationSchema = createSelectSchema(
  contactPageConfigurations,
);

export const insertNavigationGlassmorphismSettingsSchema = createInsertSchema(
  navigationGlassmorphismSettings,
);
export const selectNavigationGlassmorphismSettingsSchema = createSelectSchema(
  navigationGlassmorphismSettings,
);
