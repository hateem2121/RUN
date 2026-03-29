import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  pgView,
  real,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const aboutSections = pgTable(
  "about_sections",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    content: text(),
    sectionType: varchar("section_type", { length: 100 }).notNull(),
    imageId: integer("image_id"),
    data: jsonb(),
    mediaIds: jsonb("media_ids"),
    position: integer().default(0),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("about_sections_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("about_sections_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("about_sections_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "about_sections_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const aboutMapLocations = pgTable(
  "about_map_locations",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    latitude: numeric({ precision: 10, scale: 8 }).notNull(),
    longitude: numeric({ precision: 11, scale: 8 }).notNull(),
    description: text(),
    address: text(),
    locationType: varchar("location_type", { length: 100 }),
    type: varchar({ length: 50 }),
    city: varchar({ length: 255 }),
    country: varchar({ length: 255 }),
    details: text(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("about_map_locations_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
  ],
);

export const aboutTeamMessages = pgTable(
  "about_team_messages",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    position: varchar({ length: 255 }),
    message: text().notNull(),
    imageId: integer("image_id"),
    title: varchar({ length: 255 }),
    signature: varchar({ length: 255 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("about_team_messages_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("about_team_messages_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("about_team_messages_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "about_team_messages_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const aboutStatistics = pgTable(
  "about_statistics",
  {
    id: serial().primaryKey().notNull(),
    label: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 100 }).notNull(),
    unit: varchar({ length: 50 }),
    description: text(),
    iconName: varchar("icon_name", { length: 100 }),
    icon: varchar({ length: 100 }),
    position: integer().default(0),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("about_statistics_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("about_statistics_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const aboutTimelineEntries = pgTable(
  "about_timeline_entries",
  {
    id: serial().primaryKey().notNull(),
    year: varchar({ length: 10 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    imageId: integer("image_id"),
    position: integer().default(0),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("about_timeline_entries_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("about_timeline_entries_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("about_timeline_entries_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "about_timeline_entries_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const accessories = pgTable(
  "accessories",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    category: varchar({ length: 100 }),
    type: varchar({ length: 100 }),
    material: varchar({ length: 255 }),
    color: varchar({ length: 100 }),
    size: varchar({ length: 100 }),
    sku: varchar({ length: 100 }),
    price: numeric({ precision: 10, scale: 2 }),
    imageId: integer("image_id"),
    specifications: jsonb(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    index("accessories_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("accessories_sku_idx").using("btree", table.sku.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "accessories_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const animationErrors = pgTable("animation_errors", {
  id: serial().primaryKey().notNull(),
  errorType: varchar("error_type", { length: 100 }).notNull(),
  message: text().notNull(),
  stackTrace: text("stack_trace"),
  componentName: varchar("component_name", { length: 255 }),
  url: varchar({ length: 500 }),
  userAgent: varchar("user_agent", { length: 500 }),
  retryCount: integer("retry_count").default(0),
  resolved: boolean().default(false),
  resolvedAt: timestamp("resolved_at", { precision: 3, mode: "string" }),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const aboutHero = pgTable(
  "about_hero",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    description: text(),
    headline: varchar({ length: 255 }),
    subheadline: text(),
    imageId: integer("image_id"),
    videoId: integer("video_id"),
    backgroundMediaId: integer("background_media_id"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("about_hero_background_media_id_idx").using(
      "btree",
      table.backgroundMediaId.asc().nullsLast().op("int4_ops"),
    ),
    index("about_hero_image_id_idx").using("btree", table.imageId.asc().nullsLast().op("int4_ops")),
    index("about_hero_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("about_hero_video_id_idx").using("btree", table.videoId.asc().nullsLast().op("int4_ops")),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "about_hero_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [mediaAssets.id],
      name: "about_hero_video_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.backgroundMediaId],
      foreignColumns: [mediaAssets.id],
      name: "about_hero_background_media_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const auditConfiguration = pgTable("audit_configuration", {
  id: serial().primaryKey().notNull(),
  enabled: boolean().default(true),
  trackAllTables: boolean("track_all_tables").default(false),
  trackedTables: jsonb("tracked_tables"),
  defaultRetentionDays: integer("default_retention_days").default(2555),
  highComplianceRetentionDays: integer("high_compliance_retention_days").default(3650),
  criticalComplianceRetentionDays: integer("critical_compliance_retention_days").default(7300),
  batchSize: integer("batch_size").default(100),
  asyncProcessing: boolean("async_processing").default(true),
  excludeSensitiveFields: jsonb("exclude_sensitive_fields"),
  encryptPayloads: boolean("encrypt_payloads").default(false),
  alertOnCriticalChanges: boolean("alert_on_critical_changes").default(true),
  alertThreshold: integer("alert_threshold").default(100),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial().primaryKey().notNull(),
  action: varchar({ length: 50 }).notNull(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id", { length: 50 }).notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changedFields: jsonb("changed_fields"),
  userId: varchar("user_id", { length: 100 }),
  userEmail: varchar("user_email", { length: 255 }),
  userRole: varchar("user_role", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 255 }),
  reason: text(),
  metadata: jsonb(),
  timestamp: timestamp({ precision: 3, mode: "string" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  complianceLevel: varchar("compliance_level", { length: 50 }).default("standard"),
  retentionPeriod: integer("retention_period").default(2555),
});

export const certificates = pgTable(
  "certificates",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 100 }).default("sustainability"),
    issuingOrganization: varchar("issuing_organization", { length: 255 }),
    description: text(),
    certificateNumber: varchar("certificate_number", { length: 100 }),
    issueDate: timestamp("issue_date", { precision: 3, mode: "string" }),
    expiryDate: timestamp("expiry_date", { precision: 3, mode: "string" }),
    imageId: integer("image_id"),
    documentId: integer("document_id"),
    issuingBody: varchar("issuing_body", { length: 255 }),
    documentUrl: varchar("document_url", { length: 500 }),
    imageUrl: varchar("image_url", { length: 500 }),
    status: varchar({ length: 50 }).default("active"),
    showOnSustainabilityPage: boolean("show_on_sustainability_page").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    index("certificates_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("certificates_show_on_sustainability_idx").using(
      "btree",
      table.showOnSustainabilityPage.asc().nullsLast().op("bool_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "certificates_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [mediaAssets.id],
      name: "certificates_document_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const contactPageConfigurations = pgTable("contact_page_configurations", {
  id: serial().primaryKey().notNull(),
  title: varchar({ length: 255 }),
  heroTitle: varchar("hero_title", { length: 255 }),
  description: text(),
  address: text(),
  phone: varchar({ length: 50 }),
  email: varchar({ length: 255 }),
  workingHours: text("working_hours"),
  mapCoordinates: jsonb("map_coordinates"),
  socialLinks: jsonb("social_links"),
  locationLine1: text("location_line1"),
  locationLine2: text("location_line2"),
  locationButtonText: varchar("location_button_text", { length: 100 }).default("GET DIRECTIONS"),
  tradingHours: jsonb("trading_hours"),
  platformOptions: jsonb("platform_options").default([
    "Phone Call",
    "WhatsApp",
    "WeChat",
    "Telegram",
    "Other",
  ]),
  formButtonText: varchar("form_button_text", { length: 255 }).default(
    "Get a Response Within 24 Hours",
  ),
  formPrivacyText: text("form_privacy_text").default(
    "We value your privacy and will never share your information.",
  ),
  successHeading: varchar("success_heading", { length: 255 }).default("Thank you!"),
  successMessage: text("success_message").default(
    "We've received your message and will be in touch shortly.",
  ),
  contactInfoTitle: varchar("contact_info_title", { length: 255 }),
  contactInfoSubtitle: text("contact_info_subtitle"),
  showContactInfo: boolean("show_contact_info").default(true),
  showBusinessHours: boolean("show_business_hours").default(true),
  showLocationMap: boolean("show_location_map").default(true),
  heroBackgroundStyle: varchar("hero_background_style", { length: 100 }).default("gradient"),
  heroBackgroundColor: varchar("hero_background_color", { length: 50 }),
  contactCardsLayout: varchar("contact_cards_layout", { length: 50 }).default("grid"),
  showFormInSeparateSection: boolean("show_form_in_separate_section").default(false),
  formBackgroundStyle: varchar("form_background_style", { length: 100 }).default("default"),
  metaTitle: varchar("meta_title", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const fibers = pgTable(
  "fibers",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 100 }).notNull(),
    description: text(),
    sustainabilityScore: integer("sustainability_score"),
    environmentalImpact: text("environmental_impact"),
    properties: jsonb(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    index("fibers_deleted_at_idx").using(
      "btree",
      table.deletedAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("fibers_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
    index("fibers_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
  ],
);

export const folders = pgTable("folders", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  parentId: integer("parent_id"),
  path: varchar({ length: 500 }),
  level: integer().default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
});

export const footerConfiguration = pgTable("footer_configuration", {
  id: serial().primaryKey().notNull(),
  contactFormHeading: text("contact_form_heading").default("GET IN TOUCH WITH RUN APPAREL"),
  contactFormEnabled: boolean("contact_form_enabled").default(true),
  navigationColumns: jsonb("navigation_columns").default([]).notNull(),
  socialLinks: jsonb("social_links").default([]).notNull(),
  certificateIds: jsonb("certificate_ids").default([]).notNull(),
  legalLinks: jsonb("legal_links").default([]).notNull(),
  companyName: varchar("company_name", { length: 255 }).default("RUN APPAREL (PVT) LTD"),
  companyAddress: text("company_address").default("13km Daska Road, Sialkot 51040, Pakistan"),
  companyPhone: varchar("company_phone", { length: 50 }).default("+92 336 1777313"),
  companyEmail: varchar("company_email", { length: 255 }).default("team@run-apparel.com"),
  brandText: varchar("brand_text", { length: 255 }).default("RUN APPAREL"),
  brandTagline: varchar("brand_tagline", { length: 255 }).default(
    "Ethically Engineered • Sustainably Crafted",
  ),
  brandSubtext: varchar("brand_subtext", { length: 255 }).default(
    "A subsidiary of Durus Industries",
  ),
  structuredData: jsonb("structured_data"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const homepageFeaturedProductsSettings = pgTable("homepage_featured_products_settings", {
  id: serial().primaryKey().notNull(),
  title: varchar({ length: 255 }),
  maxProducts: integer("max_products").default(8),
  autoSelect: boolean("auto_select").default(true),
  selectedProductIds: jsonb("selected_product_ids"),
  sortBy: varchar("sort_by", { length: 50 }).default("featured"),
  isActive: boolean("is_active").default(true),
  isEnabled: boolean("is_enabled").default(true),
  dotGrid: jsonb("dot_grid"),
  liquidGlass: jsonb("liquid_glass"),
  swipeAnimation: jsonb("swipe_animation"),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const fabrics = pgTable(
  "fabrics",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    fabricType: varchar("fabric_type", { length: 100 }),
    sport: text(),
    marketSegment: text("market_segment"),
    seasonality: text(),
    weight: varchar({ length: 50 }),
    weave: varchar({ length: 100 }),
    weaveType: varchar("weave_type", { length: 100 }),
    weaveTypes: jsonb("weave_types"),
    stretch: varchar({ length: 50 }),
    finishTreatment: varchar("finish_treatment", { length: 255 }),
    properties: jsonb(),
    careInstructions: text("care_instructions"),
    sustainabilityScore: integer("sustainability_score"),
    certifications: jsonb(),
    visualSwatchId: integer("visual_swatch_id"),
    keyApplications: jsonb("key_applications"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    index("fabrics_active_query_idx").using(
      "btree",
      table.deletedAt.asc().nullsLast().op("timestamp_ops"),
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("fabrics_deleted_at_idx").using(
      "btree",
      table.deletedAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("fabrics_fabric_type_idx").using(
      "btree",
      table.fabricType.asc().nullsLast().op("text_ops"),
    ),
    index("fabrics_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
    index("fabrics_seasonality_idx").using(
      "btree",
      table.seasonality.asc().nullsLast().op("text_ops"),
    ),
    index("fabrics_sport_idx").using("btree", table.sport.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.visualSwatchId],
      foreignColumns: [mediaAssets.id],
      name: "fabrics_visual_swatch_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const homepageProcessCards = pgTable(
  "homepage_process_cards",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    imageId: integer("image_id"),
    iconName: varchar("icon_name", { length: 100 }),
    step: integer().notNull(),
    icon: varchar({ length: 100 }),
    iconMediaId: integer("icon_media_id"),
    iconType: varchar("icon_type", { length: 20 }),
    category: varchar({ length: 100 }),
    position: integer().default(0),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("homepage_process_cards_icon_media_id_idx").using(
      "btree",
      table.iconMediaId.asc().nullsLast().op("int4_ops"),
    ),
    index("homepage_process_cards_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("homepage_process_cards_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("homepage_process_cards_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "homepage_process_cards_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.iconMediaId],
      foreignColumns: [mediaAssets.id],
      name: "homepage_process_cards_icon_media_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const homepageSections = pgTable(
  "homepage_sections",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }),
    heroTitle: varchar("hero_title", { length: 255 }),
    content: text(),
    sectionType: varchar("section_type", { length: 100 }).notNull(),
    data: jsonb(),
    mediaIds: jsonb("media_ids"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("homepage_sections_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("homepage_sections_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const homepageSlogans = pgTable(
  "homepage_slogans",
  {
    id: serial().primaryKey().notNull(),
    text: text().notNull(),
    position: varchar({ length: 50 }),
    fontSize: varchar("font_size", { length: 20 }),
    color: varchar({ length: 20 }),
    animationType: varchar("animation_type", { length: 50 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("homepage_slogans_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("homepage_slogans_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const homepageSustainability = pgTable(
  "homepage_sustainability",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    imageId: integer("image_id"),
    metrics: jsonb(),
    highlightedFeatures: jsonb("highlighted_features"),
    statistics: jsonb(),
    impactMetrics: jsonb("impact_metrics"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    certificationIds: jsonb("certification_ids").default([]),
  },
  (table) => [
    index("homepage_sustainability_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("homepage_sustainability_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "homepage_sustainability_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const inquiries = pgTable(
  "inquiries",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity({
      name: "inquiries_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    name: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 320 }).notNull(),
    company: varchar({ length: 100 }),
    phone: varchar({ length: 20 }),
    country: varchar({ length: 100 }),
    preferredPlatform: varchar("preferred_platform", { length: 50 }),
    message: text().notNull(),
    source: varchar({ length: 50 }).default("contact-page").notNull(),
    status: varchar({ length: 20 }).default("new").notNull(),
    submittedAt: timestamp("submitted_at", { precision: 3, mode: "string" }).defaultNow().notNull(),
    respondedAt: timestamp("responded_at", { precision: 3, mode: "string" }),
    adminNotes: text("admin_notes"),
    assignedTo: varchar("assigned_to", { length: 100 }),
  },
  (table) => [
    index("inquiries_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
    index("inquiries_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
    index("inquiries_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
    index("inquiries_status_submitted_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
      table.submittedAt.desc().nullsLast().op("text_ops"),
    ),
    index("inquiries_submitted_at_idx").using(
      "btree",
      table.submittedAt.desc().nullsLast().op("timestamp_ops"),
    ),
  ],
);

export const homepageHero = pgTable(
  "homepage_hero",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    description: text(),
    primaryImageId: integer("primary_image_id"),
    backgroundImageId: integer("background_image_id"),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("homepage_hero_background_image_id_idx").using(
      "btree",
      table.backgroundImageId.asc().nullsLast().op("int4_ops"),
    ),
    index("homepage_hero_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("homepage_hero_primary_image_id_idx").using(
      "btree",
      table.primaryImageId.asc().nullsLast().op("int4_ops"),
    ),
    index("homepage_hero_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.primaryImageId],
      foreignColumns: [mediaAssets.id],
      name: "homepage_hero_primary_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.backgroundImageId],
      foreignColumns: [mediaAssets.id],
      name: "homepage_hero_background_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const logoAnimationSettings = pgTable("logo_animation_settings", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  duration: integer().default(2000),
  delay: integer().default(0),
  easing: varchar({ length: 100 }).default("ease-out"),
  scale: numeric({ precision: 4, scale: 2 }).default("1.0"),
  rotation: integer().default(0),
  opacity: numeric({ precision: 3, scale: 2 }).default("1.0"),
  motionEnabled: boolean("motion_enabled").default(true),
  motionSpeed: numeric("motion_speed", { precision: 3, scale: 2 }),
  motionElements: jsonb("motion_elements"),
  animationDurationMultiplier: numeric("animation_duration_multiplier", {
    precision: 3,
    scale: 2,
  }).default("1.0"),
  drawStagger: numeric("draw_stagger", { precision: 4, scale: 2 }),
  drawEasing: varchar("draw_easing", { length: 100 }),
  skipButtonEnabled: boolean("skip_button_enabled").default(false),
  showFrequency: boolean("show_frequency").default(false),
  customCssClass: varchar("custom_css_class", { length: 255 }),
  debugMode: boolean("debug_mode").default(false),
  settings: jsonb(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const manufacturingHero = pgTable(
  "manufacturing_hero",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    headline: varchar({ length: 255 }),
    subheadline: text(),
    description: text(),
    imageId: integer("image_id"),
    videoId: integer("video_id"),
    backgroundMediaId: integer("background_media_id"),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    bottomCtaTitle: varchar("bottom_cta_title", { length: 255 }),
    bottomCtaDescription: text("bottom_cta_description"),
    bottomCtaText: varchar("bottom_cta_text", { length: 100 }),
    bottomCtaLink: varchar("bottom_cta_link", { length: 255 }),
  },
  (table) => [
    index("manufacturing_hero_background_media_id_idx").using(
      "btree",
      table.backgroundMediaId.asc().nullsLast().op("int4_ops"),
    ),
    index("manufacturing_hero_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("manufacturing_hero_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("manufacturing_hero_video_id_idx").using(
      "btree",
      table.videoId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "manufacturing_hero_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [mediaAssets.id],
      name: "manufacturing_hero_video_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.backgroundMediaId],
      foreignColumns: [mediaAssets.id],
      name: "manufacturing_hero_background_media_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const manufacturingCapabilities = pgTable(
  "manufacturing_capabilities",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }),
    description: text(),
    capacity: varchar({ length: 255 }),
    unit: varchar({ length: 50 }),
    category: varchar({ length: 100 }),
    icon: varchar({ length: 100 }),
    imageId: integer("image_id"),
    equipment: jsonb(),
    specifications: jsonb(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("manufacturing_capabilities_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("manufacturing_capabilities_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("manufacturing_capabilities_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "manufacturing_capabilities_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const navigationItems = pgTable(
  "navigation_items",
  {
    id: serial().primaryKey().notNull(),
    label: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }),
    title: varchar({ length: 255 }),
    url: varchar({ length: 255 }),
    href: varchar({ length: 255 }),
    path: varchar({ length: 255 }),
    iconName: varchar("icon_name", { length: 100 }),
    iconType: varchar("icon_type", { length: 20 }).default("fallback"),
    iconSize: varchar("icon_size", { length: 20 }).default("medium"),
    fallbackIcon: varchar("fallback_icon", { length: 100 }).default("IconHome"),
    mediaIconId: integer("media_icon_id"),
    parentId: integer("parent_id"),
    level: integer().default(0),
    showOnDesktop: boolean("show_on_desktop").default(true),
    showOnMobile: boolean("show_on_mobile").default(true),
    isExternal: boolean("is_external").default(false),
    target: varchar({ length: 20 }).default("_self"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.mediaIconId],
      foreignColumns: [mediaAssets.id],
      name: "navigation_items_media_icon_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const manufacturingProcesses = pgTable(
  "manufacturing_processes",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }),
    description: text(),
    step: integer().notNull(),
    position: integer(),
    duration: varchar({ length: 100 }),
    efficiency: integer(),
    category: varchar({ length: 100 }),
    iconName: varchar("icon_name", { length: 100 }),
    imageId: integer("image_id"),
    mediaIds: jsonb("media_ids"),
    equipment: jsonb(),
    specifications: jsonb(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("manufacturing_processes_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("manufacturing_processes_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("manufacturing_processes_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "manufacturing_processes_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const navigationGlassmorphismSettings = pgTable("navigation_glassmorphism_settings", {
  id: serial().primaryKey().notNull(),
  opacity: numeric({ precision: 3, scale: 2 }).default("0.8"),
  blur: integer().default(10),
  borderRadius: integer("border_radius").default(12),
  backdropFilter: varchar("backdrop_filter", { length: 100 }).default("blur(10px)"),
  backgroundColor: varchar("background_color", { length: 50 }).default("rgba(255,255,255,0.1)"),
  borderColor: varchar("border_color", { length: 50 }).default("rgba(255,255,255,0.2)"),
  backgroundOpacity: numeric("background_opacity", { precision: 3, scale: 2 }).default("0.8"),
  blurStrength: integer("blur_strength").default(10),
  borderOpacity: numeric("border_opacity", { precision: 3, scale: 2 }).default("0.2"),
  shadowIntensity: numeric("shadow_intensity", { precision: 3, scale: 2 }).default("0.1"),
  topHighlightOpacity: numeric("top_highlight_opacity", { precision: 3, scale: 2 }).default("0.5"),
  leftHighlightOpacity: numeric("left_highlight_opacity", { precision: 3, scale: 2 }).default(
    "0.3",
  ),
  innerShadowOpacity: numeric("inner_shadow_opacity", { precision: 3, scale: 2 }).default("0.5"),
  enabled: boolean().default(true),
  settings: jsonb(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    description: text(),
    shortDescription: text("short_description"),
    categoryId: integer("category_id").notNull(),
    primaryImageId: integer("primary_image_id"),
    primaryVideoId: integer("primary_video_id"),
    modelFileId: integer("model_file_id"),
    sku: varchar({ length: 100 }).notNull(),
    minimumOrderQuantity: integer("minimum_order_quantity").default(1),
    leadTime: varchar("lead_time", { length: 100 }),
    specifications: jsonb(),
    technicalSpecs: jsonb("technical_specs"),
    fiberComposition: jsonb("fiber_composition"),
    tags: jsonb(),
    careInstructions: jsonb("care_instructions"),
    imageIds: jsonb("image_ids"),
    videos: jsonb(),
    urlPath: varchar("url_path", { length: 500 }),
    customWeight: varchar("custom_weight", { length: 100 }),
    customFit: varchar("custom_fit", { length: 100 }),
    customizationOptions: jsonb("customization_options"),
    fabricId: integer("fabric_id"),
    sizeChartId: integer("size_chart_id"),
    certificateIds: jsonb("certificate_ids"),
    accessoryIds: jsonb("accessory_ids"),
    relatedProductIds: jsonb("related_product_ids"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metadata: jsonb(),
    isActive: boolean("is_active").default(true),
    isFeatured: boolean("is_featured").default(false),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    index("products_active_created_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("timestamp_ops"),
      table.createdAt.desc().nullsLast().op("bool_ops"),
    ),
    index("products_category_active_idx").using(
      "btree",
      table.categoryId.asc().nullsLast().op("int4_ops"),
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("products_category_id_idx").using(
      "btree",
      table.categoryId.asc().nullsLast().op("int4_ops"),
    ),
    index("products_fabric_id_idx").using("btree", table.fabricId.asc().nullsLast().op("int4_ops")),
    index("products_featured_active_idx").using(
      "btree",
      table.isFeatured.asc().nullsLast().op("bool_ops"),
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("products_hot_query_idx").using(
      "btree",
      table.deletedAt.asc().nullsLast().op("bool_ops"),
      table.isActive.asc().nullsLast().op("timestamp_ops"),
      table.createdAt.desc().nullsLast().op("timestamp_ops"),
    ),
    index("products_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
    index("products_is_featured_idx").using(
      "btree",
      table.isFeatured.asc().nullsLast().op("bool_ops"),
    ),
    index("products_model_file_id_idx").using(
      "btree",
      table.modelFileId.asc().nullsLast().op("int4_ops"),
    ),
    index("products_primary_image_id_idx").using(
      "btree",
      table.primaryImageId.asc().nullsLast().op("int4_ops"),
    ),
    index("products_primary_video_id_idx").using(
      "btree",
      table.primaryVideoId.asc().nullsLast().op("int4_ops"),
    ),
    index("products_sku_idx").using("btree", table.sku.asc().nullsLast().op("text_ops")),
    index("products_url_path_active_idx").using(
      "btree",
      table.urlPath.asc().nullsLast().op("bool_ops"),
      table.isActive.asc().nullsLast().op("timestamp_ops"),
      table.deletedAt.asc().nullsLast().op("timestamp_ops"),
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "products_category_id_categories_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.primaryImageId],
      foreignColumns: [mediaAssets.id],
      name: "products_primary_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.primaryVideoId],
      foreignColumns: [mediaAssets.id],
      name: "products_primary_video_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.modelFileId],
      foreignColumns: [mediaAssets.id],
      name: "products_model_file_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.fabricId],
      foreignColumns: [fabrics.id],
      name: "products_fabric_id_fabrics_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.sizeChartId],
      foreignColumns: [sizeCharts.id],
      name: "products_size_chart_id_size_charts_id_fk",
    }).onDelete("set null"),
    unique("products_slug_unique").on(table.slug),
  ],
);

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial().primaryKey().notNull(),
  metricType: varchar("metric_type", { length: 100 }).notNull(),
  componentName: varchar("component_name", { length: 255 }).notNull(),
  component: varchar({ length: 255 }),
  value: numeric({ precision: 12, scale: 4 }).notNull(),
  unit: varchar({ length: 20 }).notNull(),
  metadata: jsonb(),
  timestamp: timestamp({ precision: 3, mode: "string" }).defaultNow(),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const sizeCharts = pgTable(
  "size_charts",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    category: varchar({ length: 100 }),
    gender: varchar({ length: 20 }),
    type: varchar({ length: 100 }),
    region: varchar({ length: 100 }),
    measurements: jsonb(),
    sizeRange: jsonb("size_range"),
    unit: varchar({ length: 10 }).default("cm"),
    fitNotes: text("fit_notes"),
    imageId: integer("image_id"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    index("size_charts_active_query_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("timestamp_ops"),
      table.deletedAt.asc().nullsLast().op("bool_ops"),
    ),
    index("size_charts_deleted_at_idx").using(
      "btree",
      table.deletedAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("size_charts_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "size_charts_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar({ length: 255 }).primaryKey().notNull(),
    sess: jsonb().notNull(),
    expire: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => [
    index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: serial().primaryKey().notNull(),
    filename: varchar({ length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }),
    fileSize: integer("file_size"),
    size: integer(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    type: varchar({ length: 50 }).notNull(),
    url: text().notNull(),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailFilename: varchar("thumbnail_filename", { length: 255 }),
    thumbnailStoragePath: text("thumbnail_storage_path"),
    imageVariants: jsonb("image_variants"),
    storagePath: text("storage_path").notNull(),
    bucketName: varchar("bucket_name", { length: 100 }).notNull(),
    folderId: integer("folder_id"),
    tags: jsonb(),
    altText: text("alt_text"),
    caption: text(),
    metadata: jsonb().default({}).notNull(),
    uploadedAt: timestamp("uploaded_at", { precision: 3, mode: "string" }).defaultNow(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
  },
  (table) => [
    index("media_active_created_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("timestamp_ops"),
      table.createdAt.desc().nullsLast().op("bool_ops"),
    ),
    index("media_created_at_idx").using(
      "btree",
      table.createdAt.desc().nullsLast().op("timestamp_ops"),
    ),
    index("media_folder_id_idx").using("btree", table.folderId.asc().nullsLast().op("int4_ops")),
    index("media_hot_query_idx").using(
      "btree",
      table.deletedAt.asc().nullsLast().op("bool_ops"),
      table.isActive.asc().nullsLast().op("timestamp_ops"),
      table.createdAt.desc().nullsLast().op("timestamp_ops"),
    ),
    index("media_id_active_idx").using(
      "btree",
      table.id.asc().nullsLast().op("timestamp_ops"),
      table.isActive.asc().nullsLast().op("int4_ops"),
      table.deletedAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("media_mime_type_idx").using("btree", table.mimeType.asc().nullsLast().op("text_ops")),
    index("media_original_name_idx").using(
      "btree",
      table.originalName.asc().nullsLast().op("text_ops"),
    ),
    index("media_type_active_idx").using(
      "btree",
      table.type.asc().nullsLast().op("text_ops"),
      table.isActive.asc().nullsLast().op("text_ops"),
    ),
    index("media_uploaded_at_idx").using(
      "btree",
      table.uploadedAt.desc().nullsLast().op("timestamp_ops"),
    ),
    foreignKey({
      columns: [table.folderId],
      foreignColumns: [folders.id],
      name: "media_assets_folder_id_folders_id_fk",
    }).onDelete("set null"),
  ],
);

export const manufacturingQualities = pgTable(
  "manufacturing_qualities",
  {
    id: serial().primaryKey().notNull(),
    standards: text().array(),
    title: varchar({ length: 255 }),
    description: text(),
    icon: varchar({ length: 100 }),
    imageId: integer("image_id"),
    certificateId: integer("certificate_id"),
    category: varchar({ length: 100 }),
    testingMethod: varchar("testing_method", { length: 255 }),
    frequency: varchar({ length: 100 }),
    checkpoints: jsonb(),
    criteria: jsonb(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("manufacturing_qualities_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("manufacturing_qualities_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("manufacturing_qualities_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "manufacturing_qualities_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const storageAnalysisResults = pgTable("storage_analysis_results", {
  id: serial().primaryKey().notNull(),
  timestamp: varchar({ length: 50 }).notNull(),
  totalFiles: integer("total_files").notNull(),
  totalSize: integer("total_size").notNull(),
  referencedFiles: integer("referenced_files").notNull(),
  orphanedCount: integer("orphaned_count").notNull(),
  duplicateGroups: integer("duplicate_groups").notNull(),
  compressionCandidates: integer("compression_candidates").notNull(),
  potentialSavings: jsonb("potential_savings"),
  analysisTime: integer("analysis_time").notNull(),
  version: varchar({ length: 50 }).notNull(),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const storageChangeLogs = pgTable("storage_change_logs", {
  id: serial().primaryKey().notNull(),
  timestamp: varchar({ length: 50 }).notNull(),
  action: varchar({ length: 20 }).notNull(),
  mediaId: integer("media_id").notNull(),
  filename: varchar({ length: 255 }).notNull(),
  size: integer(),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
});

export const sustainabilityHero = pgTable(
  "sustainability_hero",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    description: text(),
    imageId: integer("image_id"),
    videoId: integer("video_id"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("sustainability_hero_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("sustainability_hero_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("sustainability_hero_video_id_idx").using(
      "btree",
      table.videoId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "sustainability_hero_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [mediaAssets.id],
      name: "sustainability_hero_video_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const sustainabilityGoals = pgTable(
  "sustainability_goals",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    target: varchar({ length: 255 }),
    currentProgress: numeric("current_progress", { precision: 5, scale: 2 }),
    currentValue: numeric("current_value", { precision: 10, scale: 2 }),
    targetValue: numeric("target_value", { precision: 10, scale: 2 }),
    targetYear: integer("target_year"),
    unit: varchar({ length: 50 }),
    targetDate: timestamp("target_date", { precision: 3, mode: "string" }),
    category: varchar({ length: 100 }),
    priority: varchar({ length: 20 }).default("medium"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("sustainability_goals_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("sustainability_goals_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const sustainabilityInitiatives = pgTable(
  "sustainability_initiatives",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    impact: text(),
    imageId: integer("image_id"),
    iconName: varchar("icon_name", { length: 50 }),
    category: varchar({ length: 100 }),
    highlightedFeatures: jsonb("highlighted_features"),
    status: varchar({ length: 50 }).default("active"),
    startDate: timestamp("start_date", { precision: 3, mode: "string" }),
    targetDate: timestamp("target_date", { precision: 3, mode: "string" }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("sustainability_initiatives_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("sustainability_initiatives_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("sustainability_initiatives_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "sustainability_initiatives_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const sustainabilityMetrics = pgTable(
  "sustainability_metrics",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 100 }).notNull(),
    unit: varchar({ length: 50 }),
    description: text(),
    category: varchar({ length: 100 }),
    iconName: varchar("icon_name", { length: 100 }),
    icon: varchar({ length: 100 }),
    currentValue: numeric("current_value", { precision: 10, scale: 2 }),
    targetValue: numeric("target_value", { precision: 10, scale: 2 }),
    targetYear: integer("target_year"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("sustainability_metrics_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("sustainability_metrics_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const technologyCta = pgTable(
  "technology_cta",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    content: text(),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    benefits: jsonb(),
    backgroundColor: varchar("background_color", { length: 20 }),
    textColor: varchar("text_color", { length: 20 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("technology_cta_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
  ],
);

export const sustainabilityFeatures = pgTable(
  "sustainability_features",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    category: varchar({ length: 100 }),
    impact: text(),
    imageId: integer("image_id"),
    metrics: jsonb(),
    highlightedFeatures: jsonb("highlighted_features"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "sustainability_features_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const technologyGradientSettings = pgTable(
  "technology_gradient_settings",
  {
    id: serial().primaryKey().notNull(),
    gradientType: varchar("gradient_type", { length: 100 }).notNull(),
    colors: jsonb(),
    direction: varchar({ length: 50 }).default("to-right"),
    opacity: numeric({ precision: 3, scale: 2 }).default("1.0"),
    settings: jsonb(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("technology_gradient_settings_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
  ],
);

export const users = pgTable(
  "users",
  {
    id: varchar({ length: 255 }).primaryKey().notNull(),
    email: varchar({ length: 255 }),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    profileImageUrl: text("profile_image_url"),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);

export const categories = pgTable(
  "categories",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    description: text(),
    parentId: integer("parent_id"),
    primaryImageId: integer("primary_image_id"),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    level: integer().default(0),
    fullPath: varchar("full_path", { length: 500 }),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    featuredOnHomepage: boolean("featured_on_homepage").default(false),
    gridPosition: integer("grid_position").default(0),
    displayOrder: integer("display_order").default(0),
    featuredContent: jsonb("featured_content"),
    bannerUrl: varchar("banner_url", { length: 500 }),
    imageUrl: varchar("image_url", { length: 500 }),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "string" }),
    version: integer().default(1).notNull(),
  },
  (table) => [
    index("categories_active_created_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
      table.createdAt.desc().nullsLast().op("bool_ops"),
    ),
    index("categories_featured_idx").using(
      "btree",
      table.featuredOnHomepage.asc().nullsLast().op("bool_ops"),
    ),
    index("categories_full_path_idx").using(
      "btree",
      table.fullPath.asc().nullsLast().op("text_ops"),
    ),
    index("categories_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("categories_parent_id_idx").using(
      "btree",
      table.parentId.asc().nullsLast().op("int4_ops"),
    ),
    uniqueIndex("categories_slug_unique_active")
      .using("btree", table.slug.asc().nullsLast().op("text_ops"))
      .where(sql`(deleted_at IS NULL)`),
    foreignKey({
      columns: [table.primaryImageId],
      foreignColumns: [mediaAssets.id],
      name: "categories_primary_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "categories_parent_id_fk",
    }).onDelete("set null"),
  ],
);

export const fabricCompositions = pgTable(
  "fabric_compositions",
  {
    id: serial().primaryKey().notNull(),
    fabricId: integer("fabric_id"),
    fiberId: integer("fiber_id"),
    percentage: numeric(),
  },
  (table) => [
    foreignKey({
      columns: [table.fabricId],
      foreignColumns: [fabrics.id],
      name: "fabric_compositions_fabric_id_fabrics_id_fk",
    }),
    foreignKey({
      columns: [table.fiberId],
      foreignColumns: [fibers.id],
      name: "fabric_compositions_fiber_id_fibers_id_fk",
    }),
  ],
);

export const technologyHero = pgTable(
  "technology_hero",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    description: text(),
    primaryButtonText: varchar("primary_button_text", { length: 100 }),
    primaryButtonLink: varchar("primary_button_link", { length: 255 }),
    secondaryButtonText: varchar("secondary_button_text", { length: 100 }),
    secondaryButtonLink: varchar("secondary_button_link", { length: 255 }),
    backgroundMediaId: integer("background_media_id"),
    imageId: integer("image_id"),
    videoId: integer("video_id"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("technology_hero_background_media_id_idx").using(
      "btree",
      table.backgroundMediaId.asc().nullsLast().op("int4_ops"),
    ),
    index("technology_hero_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("technology_hero_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("technology_hero_video_id_idx").using(
      "btree",
      table.videoId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.backgroundMediaId],
      foreignColumns: [mediaAssets.id],
      name: "technology_hero_background_media_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "technology_hero_image_id_media_assets_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [mediaAssets.id],
      name: "technology_hero_video_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const playingWithNeon = pgTable("playing_with_neon", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  value: real(),
});

export const unifiedSustainability = pgTable(
  "unified_sustainability",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    headline: varchar({ length: 255 }),
    subheadline: text(),
    content: text(),
    sectionType: varchar("section_type", { length: 100 }).notNull(),
    data: jsonb(),
    metrics: jsonb(),
    ctaText: varchar("cta_text", { length: 100 }),
    ctaLink: varchar("cta_link", { length: 255 }),
    metricsTitle: varchar("metrics_title", { length: 255 }),
    metricsDescription: text("metrics_description"),
    certificationsTitle: varchar("certifications_title", { length: 255 }),
    certificationsDescription: text("certifications_description"),
    certificationsFooterNote: text("certifications_footer_note"),
    certificationIds: jsonb("certification_ids"),
    initiativesTitle: varchar("initiatives_title", { length: 255 }),
    initiativesDescription: text("initiatives_description"),
    goalsTitle: varchar("goals_title", { length: 255 }),
    goalsDescription: text("goals_description"),
    fabricPortfolioTitle: varchar("fabric_portfolio_title", { length: 255 }),
    callToActionTitle: varchar("call_to_action_title", { length: 255 }),
    callToActionDescription: text("call_to_action_description"),
    callToActionButtonText: varchar("call_to_action_button_text", { length: 100 }),
    callToActionButtonLink: varchar("call_to_action_button_link", { length: 255 }),
    buttonText: varchar("button_text", { length: 100 }),
    buttonLink: varchar("button_link", { length: 255 }),
    backgroundImageId: integer("background_image_id"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    featuresTitle: varchar("features_title", { length: 255 }),
    featuresDescription: text("features_description"),
    fabricPortfolioDescription: text("fabric_portfolio_description"),
  },
  (table) => [
    foreignKey({
      columns: [table.backgroundImageId],
      foreignColumns: [mediaAssets.id],
      name: "unified_sustainability_background_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const technologyRoadmap = pgTable(
  "technology_roadmap",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    timeline: varchar({ length: 255 }),
    targetDate: timestamp("target_date", { precision: 3, mode: "string" }),
    status: varchar({ length: 50 }).default("planned"),
    priority: varchar({ length: 20 }).default("medium"),
    milestones: jsonb(),
    impact: jsonb(),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    imageId: integer("image_id"),
    videoId: integer("video_id"),
  },
  (table) => [
    index("technology_roadmap_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("technology_roadmap_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "technology_roadmap_image_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [mediaAssets.id],
      name: "technology_roadmap_video_id_fkey",
    }).onDelete("set null"),
  ],
);

export const technologyInnovations = pgTable(
  "technology_innovations",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    category: varchar({ length: 100 }),
    benefits: jsonb(),
    imageId: integer("image_id"),
    developmentYear: varchar("development_year", { length: 10 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    shortDescription: varchar("short_description", { length: 255 }),
    technicalDetails: jsonb("technical_details"),
    iconName: varchar("icon_name", { length: 255 }),
    status: varchar({ length: 50 }).default("Active"),
    relatedProducts: jsonb("related_products"),
  },
  (table) => [
    index("technology_innovations_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("technology_innovations_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("technology_innovations_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "technology_innovations_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const technologyEquipment = pgTable(
  "technology_equipment",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    manufacturer: varchar({ length: 255 }),
    model: varchar({ length: 255 }),
    description: text(),
    specifications: jsonb(),
    imageId: integer("image_id"),
    installationDate: timestamp("installation_date", { precision: 3, mode: "string" }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    category: varchar({ length: 100 }),
    capacity: varchar({ length: 100 }),
    maintenanceSchedule: varchar("maintenance_schedule", { length: 255 }),
    certifications: jsonb(),
    quantity: integer().default(1),
  },
  (table) => [
    index("technology_equipment_image_id_idx").using(
      "btree",
      table.imageId.asc().nullsLast().op("int4_ops"),
    ),
    index("technology_equipment_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("technology_equipment_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [mediaAssets.id],
      name: "technology_equipment_image_id_media_assets_id_fk",
    }).onDelete("set null"),
  ],
);

export const technologyResearch = pgTable(
  "technology_research",
  {
    id: serial().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    researchArea: varchar("research_area", { length: 255 }),
    status: varchar({ length: 50 }).default("ongoing"),
    startDate: timestamp("start_date", { precision: 3, mode: "string" }),
    expectedCompletion: timestamp("expected_completion", { precision: 3, mode: "string" }),
    partners: jsonb(),
    currentProjects: jsonb("current_projects"),
    publications: jsonb(),
    outcomes: jsonb(),
    funding: numeric({ precision: 12, scale: 2 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).defaultNow(),
    teamMembers: jsonb("team_members"),
    objectives: jsonb(),
  },
  (table) => [
    index("technology_research_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("technology_research_sort_order_idx").using(
      "btree",
      table.sortOrder.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial().primaryKey().notNull(),
    email: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [unique("newsletter_subscribers_email_unique").on(table.email)],
);
export const pgStatStatementsInfo = pgView("pg_stat_statements_info", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  dealloc: bigint({ mode: "number" }),
  statsReset: timestamp("stats_reset", { withTimezone: true, mode: "string" }),
}).as(
  sql`SELECT dealloc, stats_reset FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset)`,
);

export const productRelations = pgTable(
  "product_relations",
  {
    id: serial().primaryKey().notNull(),
    productId: integer("product_id").notNull(),
    relatedProductId: integer("related_product_id").notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("product_relations_product_id_idx").using(
      "btree",
      table.productId.asc().nullsLast().op("int4_ops"),
    ),
    index("product_relations_related_product_id_idx").using(
      "btree",
      table.relatedProductId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_relations_product_id_products_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.relatedProductId],
      foreignColumns: [products.id],
      name: "product_relations_related_product_id_products_id_fk",
    }).onDelete("cascade"),
  ],
);

export const pgStatStatements = pgView("pg_stat_statements", {
  // TODO: failed to parse database type 'oid'
  userid: bigint("userid", { mode: "number" }),
  // TODO: failed to parse database type 'oid'
  dbid: bigint("dbid", { mode: "number" }),
  toplevel: boolean(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  queryid: bigint({ mode: "number" }),
  query: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  plans: bigint({ mode: "number" }),
  totalPlanTime: doublePrecision("total_plan_time"),
  minPlanTime: doublePrecision("min_plan_time"),
  maxPlanTime: doublePrecision("max_plan_time"),
  meanPlanTime: doublePrecision("mean_plan_time"),
  stddevPlanTime: doublePrecision("stddev_plan_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  calls: bigint({ mode: "number" }),
  totalExecTime: doublePrecision("total_exec_time"),
  minExecTime: doublePrecision("min_exec_time"),
  maxExecTime: doublePrecision("max_exec_time"),
  meanExecTime: doublePrecision("mean_exec_time"),
  stddevExecTime: doublePrecision("stddev_exec_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  rows: bigint({ mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksHit: bigint("shared_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksRead: bigint("shared_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksDirtied: bigint("shared_blks_dirtied", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksWritten: bigint("shared_blks_written", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksHit: bigint("local_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksRead: bigint("local_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksDirtied: bigint("local_blks_dirtied", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksWritten: bigint("local_blks_written", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksRead: bigint("temp_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksWritten: bigint("temp_blks_written", { mode: "number" }),
  sharedBlkReadTime: doublePrecision("shared_blk_read_time"),
  sharedBlkWriteTime: doublePrecision("shared_blk_write_time"),
  localBlkReadTime: doublePrecision("local_blk_read_time"),
  localBlkWriteTime: doublePrecision("local_blk_write_time"),
  tempBlkReadTime: doublePrecision("temp_blk_read_time"),
  tempBlkWriteTime: doublePrecision("temp_blk_write_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walRecords: bigint("wal_records", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walFpi: bigint("wal_fpi", { mode: "number" }),
  walBytes: numeric("wal_bytes"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitFunctions: bigint("jit_functions", { mode: "number" }),
  jitGenerationTime: doublePrecision("jit_generation_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitInliningCount: bigint("jit_inlining_count", { mode: "number" }),
  jitInliningTime: doublePrecision("jit_inlining_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitOptimizationCount: bigint("jit_optimization_count", { mode: "number" }),
  jitOptimizationTime: doublePrecision("jit_optimization_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitEmissionCount: bigint("jit_emission_count", { mode: "number" }),
  jitEmissionTime: doublePrecision("jit_emission_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitDeformCount: bigint("jit_deform_count", { mode: "number" }),
  jitDeformTime: doublePrecision("jit_deform_time"),
  statsSince: timestamp("stats_since", { withTimezone: true, mode: "string" }),
  minmaxStatsSince: timestamp("minmax_stats_since", { withTimezone: true, mode: "string" }),
}).as(
  sql`SELECT userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since FROM pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since)`,
);
