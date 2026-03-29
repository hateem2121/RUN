import { serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "./common";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar({ length: 255 }).unique().notNull(), // Encrypted (AES-256-GCM)
  emailIndex: varchar({ length: 255 }).unique(), // Blind Index (HMAC-SHA256)
  subscribedAt: timestamp({ mode: "date", precision: 3 }).defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
