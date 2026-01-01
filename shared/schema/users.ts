import { boolean, index, jsonb, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "./common";

// =============================================================================
// REPLIT AUTH TABLES
// Reference: https://docs.replit.com/hosting/deployments/replit-authn
// Cost Optimization: https://neon.tech/docs/guides/node
// ✓ CHECKPOINT: PHASE-1-SCHEMA-ADDED
// =============================================================================

/**
 * Session storage table (REQUIRED by connect-pg-simple)
 * Stores encrypted session data with automatic expiration cleanup
 * TTL: 7 days (604800000ms) managed by connect-pg-simple
 */
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { mode: "date", precision: 3 }).notNull(),
  },
  (table) => [
    // PERFORMANCE: Index for session cleanup queries (DELETE WHERE expire < NOW())
    // Prevents full table scans during automatic session cleanup
    index("IDX_session_expire").on(table.expire),
  ],
);

/**
 * Users table (REQUIRED by Replit Auth)
 * Auto-populated via OpenID Connect on first login
 * Admin promotion must be done manually via SQL
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Replit user ID (stable, unique)
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: text("profile_image_url"),

  // ROLE-BASED ACCESS CONTROL
  // Admin status NOT auto-updated on login - must be set via SQL
  isAdmin: boolean("is_admin").default(false).notNull(),

  // Timestamps for audit trail
  createdAt: timestamp("created_at", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

// Export types for type safety across backend and frontend
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
