import { boolean, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "./common";

// =============================================================================
// REPLIT AUTH TABLES
// Reference: https://docs.replit.com/hosting/deployments/replit-authn
// Cost Optimization: https://neon.tech/docs/guides/node
// ✓ CHECKPOINT: PHASE-1-SCHEMA-ADDED
// =============================================================================

/**
 * Users table (REQUIRED by Replit Auth)
 * Auto-populated via OpenID Connect on first login
 * Admin promotion must be done manually via SQL
 */
export const users = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(), // Replit user ID (stable, unique)
  email: varchar({ length: 255 }).unique(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  profileImageUrl: text(),

  // ROLE-BASED ACCESS CONTROL
  // Admin status NOT auto-updated on login - must be set via SQL
  isAdmin: boolean().default(false).notNull(),

  // Timestamps for audit trail
  createdAt: timestamp({ mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date", precision: 3 }).defaultNow().notNull(),
});

// Export types for type safety across backend and frontend
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
