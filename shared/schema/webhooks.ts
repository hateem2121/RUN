import { integer, jsonb, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTable } from "./common";

/**
 * Webhook Subscriptions Table
 *
 * @description Stores endpoints subscribed to specific system events.
 */
export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  events: jsonb("events").$type<string[]>().notNull(),
  isActive: varchar("is_active", { length: 1 }).default("Y"), // 'Y' or 'N'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Webhook Deliveries Table
 *
 * @description Logs all webhook execution attempts and their results.
 */
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id")
    .references(() => webhookSubscriptions.id, { onDelete: "cascade" })
    .notNull(),
  event: varchar("event", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  attemptCount: integer("attempt_count").default(1),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = typeof webhookSubscriptions.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// Zod Schemas
export const selectWebhookSubscriptionSchema = createSelectSchema(webhookSubscriptions);
export const insertWebhookSubscriptionSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  isActive: z.enum(["Y", "N"]).optional(),
});

export const webhookEventSchema = z.object({
  id: z.string(),
  event: z.string(),
  payload: z.any(),
  timestamp: z.string(),
});
