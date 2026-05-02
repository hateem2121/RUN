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
    title: varchar({ length: 255 }).notNull(),
    subtitle: text(),
    description: text(),

    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    videoId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    backgroundMediaId: integer().references(() => mediaAssets.id, {
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
    year: varchar({ length: 10 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
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
    name: varchar({ length: 255 }).notNull(),
    latitude: decimal({ precision: 10, scale: 8 }).notNull(),
    longitude: decimal({ precision: 11, scale: 8 }).notNull(),
    description: text(),
    address: text(),
    locationType: varchar({ length: 100 }),

    // Added for component compatibility
    type: varchar({ length: 50 }),
    city: varchar({ length: 255 }),
    country: varchar({ length: 255 }),
    details: text(),

    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("about_map_locations_is_active_idx").on(table.isActive),
    index("about_map_locations_sort_order_idx").on(table.sortOrder),
  ],
);

// About Sections
export const aboutSections = pgTable(
  "about_sections",
  {
    id: serial("id").primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    content: text(),
    sectionType: varchar({ length: 100 }).notNull(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    data: jsonb().$type<Record<string, unknown>>(),
    mediaIds: jsonb().$type<number[]>(),

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
    label: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 100 }).notNull(),
    unit: varchar({ length: 50 }),
    description: text(),
    iconName: varchar({ length: 100 }),

    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
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
    name: varchar({ length: 255 }).notNull(),
    position: varchar({ length: 255 }),
    message: text().notNull(),
    imageId: integer().references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    // Added for component compatibility
    title: varchar({ length: 255 }),
    signature: varchar({ length: 255 }),

    isActive: boolean().default(true),
    sortOrder: integer().default(0),
    createdAt: timestamp({
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

export const selectAboutMapLocationSchema = createSelectSchema(aboutMapLocations);
export const insertAboutMapLocationSchema = createInsertSchema(aboutMapLocations);

export const insertAboutSectionSchema = createInsertSchema(aboutSections);
export const selectAboutSectionSchema = createSelectSchema(aboutSections);

export const insertAboutStatisticSchema = createInsertSchema(aboutStatistics);
export const selectAboutStatisticSchema = createSelectSchema(aboutStatistics);

export const insertAboutTeamMessageSchema = createInsertSchema(aboutTeamMessages);
export const selectAboutTeamMessageSchema = createSelectSchema(aboutTeamMessages);
