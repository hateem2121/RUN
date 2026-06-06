import {
  boolean,
  index,
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable } from "../common.js";

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    iconName: varchar("icon_name", { length: 100 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    features: jsonb().$type<string[]>().default([]).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("services_is_active_idx").on(table.isActive),
    index("services_sort_order_idx").on(table.sortOrder),
  ],
);

import { z } from "zod";

export const insertServiceSchema = createInsertSchema(services);
export const selectServiceSchema = createSelectSchema(services);

export const serviceReorderSchema = z.object({
  orderedIds: z.array(z.number()),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
