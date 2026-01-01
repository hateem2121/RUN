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

// About Hero
export const aboutHero = pgTable(
  "about_hero",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    description: text("description"),

    // Added for component compatibility
    headline: varchar("headline", { length: 255 }),
    subheadline: text("subheadline"),

    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer("video_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    backgroundMediaId: integer("background_media_id").references(() => mediaAssets.id, {
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
    index("about_hero_is_active_idx").on(table.isActive),
    index("about_hero_image_id_idx").on(table.imageId),
    index("about_hero_video_id_idx").on(table.videoId),
    index("about_hero_background_media_id_idx").on(table.backgroundMediaId),
  ],
);

// About Timeline Entries
export const aboutTimelineEntries = pgTable(
  "about_timeline_entries",
  {
    id: serial("id").primaryKey(),
    year: varchar("year", { length: 10 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Added for component compatibility
    position: integer("position").default(0),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_timeline_entries_is_active_idx").on(table.isActive),
    index("about_timeline_entries_image_id_idx").on(table.imageId),
    index("about_timeline_entries_sort_order_idx").on(table.sortOrder),
  ],
);

// About Map Locations
export const aboutMapLocations = pgTable(
  "about_map_locations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    description: text("description"),
    address: text("address"),
    locationType: varchar("location_type", { length: 100 }),

    // Added for component compatibility
    type: varchar("type", { length: 50 }),
    city: varchar("city", { length: 255 }),
    country: varchar("country", { length: 255 }),
    details: text("details"),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [index("about_map_locations_is_active_idx").on(table.isActive)],
);

// About Sections
export const aboutSections = pgTable(
  "about_sections",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    sectionType: varchar("section_type", { length: 100 }).notNull(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    data: jsonb("data").$type<Record<string, any>>(),
    mediaIds: jsonb("media_ids").$type<number[]>(),

    // Added for component compatibility
    position: integer("position").default(0),

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
    index("about_sections_is_active_idx").on(table.isActive),
    index("about_sections_image_id_idx").on(table.imageId),
    index("about_sections_sort_order_idx").on(table.sortOrder),
  ],
);

// About Statistics
export const aboutStatistics = pgTable(
  "about_statistics",
  {
    id: serial("id").primaryKey(),
    label: varchar("label", { length: 255 }).notNull(),
    value: varchar("value", { length: 100 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    description: text("description"),
    iconName: varchar("icon_name", { length: 100 }),

    // Added for component compatibility
    icon: varchar("icon", { length: 100 }), // alias for iconName
    position: integer("position").default(0),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_statistics_is_active_idx").on(table.isActive),
    index("about_statistics_sort_order_idx").on(table.sortOrder),
  ],
);

// About Team Messages
export const aboutTeamMessages = pgTable(
  "about_team_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    position: varchar("position", { length: 255 }),
    message: text("message").notNull(),
    imageId: integer("image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Added for component compatibility
    title: varchar("title", { length: 255 }),
    signature: varchar("signature", { length: 255 }),

    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_team_messages_is_active_idx").on(table.isActive),
    index("about_team_messages_image_id_idx").on(table.imageId),
    index("about_team_messages_sort_order_idx").on(table.sortOrder),
  ],
);

// Types
export type AboutHero = typeof aboutHero.$inferSelect;
export type InsertAboutHero = typeof aboutHero.$inferInsert;

export type AboutTimelineEntry = typeof aboutTimelineEntries.$inferSelect;
export type InsertAboutTimelineEntry = typeof aboutTimelineEntries.$inferInsert;

export type AboutMapLocation = typeof aboutMapLocations.$inferSelect;
export type InsertAboutMapLocation = typeof aboutMapLocations.$inferInsert;

export type AboutSection = typeof aboutSections.$inferSelect;
export type InsertAboutSection = typeof aboutSections.$inferInsert;

export type AboutStatistic = typeof aboutStatistics.$inferSelect;
export type InsertAboutStatistic = typeof aboutStatistics.$inferInsert;

export type AboutTeamMessage = typeof aboutTeamMessages.$inferSelect;
export type InsertAboutTeamMessage = typeof aboutTeamMessages.$inferInsert;

// Zod Schemas
export const insertAboutHeroSchema = createInsertSchema(aboutHero);
export const selectAboutHeroSchema = createSelectSchema(aboutHero);

export const insertAboutTimelineEntrySchema = createInsertSchema(aboutTimelineEntries);
export const selectAboutTimelineEntrySchema = createSelectSchema(aboutTimelineEntries);

export const insertAboutMapLocationSchema = createInsertSchema(aboutMapLocations);
export const selectAboutMapLocationSchema = createSelectSchema(aboutMapLocations);

export const insertAboutSectionSchema = createInsertSchema(aboutSections);
export const selectAboutSectionSchema = createSelectSchema(aboutSections);

export const insertAboutStatisticSchema = createInsertSchema(aboutStatistics);
export const selectAboutStatisticSchema = createSelectSchema(aboutStatistics);

export const insertAboutTeamMessageSchema = createInsertSchema(aboutTeamMessages);
export const selectAboutTeamMessageSchema = createSelectSchema(aboutTeamMessages);
