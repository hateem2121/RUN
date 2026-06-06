import { boolean, index, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable } from "../common.js";

export const legalPolicies = pgTable(
  "legal_policies",
  {
    id: serial("id").primaryKey(),
    slug: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
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
    index("legal_policies_slug_idx").on(table.slug),
    uniqueIndex("legal_policies_slug_unique_active").on(table.slug),
  ],
);

export const insertLegalPolicySchema = createInsertSchema(legalPolicies);
export const selectLegalPolicySchema = createSelectSchema(legalPolicies);

export type LegalPolicy = typeof legalPolicies.$inferSelect;
export type InsertLegalPolicy = typeof legalPolicies.$inferInsert;
