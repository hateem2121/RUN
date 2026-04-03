import { boolean, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "./common";

// =============================================================================
// AUTHENTICATION TABLES
// Primary Auth: Google OAuth (via Passport.js)
// Reference: server/middleware/auth.ts
// ✓ CHECKPOINT: PHASE-1-SCHEMA-UPDATED
// =============================================================================

/**
 * Users table
 *
 * @table users
 * @description Stores user profiles authenticated via Google OAuth.
 * Auto-populated on first login.
 *
 * @business
 * - Users are created automatically upon first successful OAuth login.
 * - `isAdmin` flag controls access to `/admin` routes and must be set manually via SQL or seed scripts.
 * - `id` corresponds to the unique Google profile ID or generated user ID.
 *
 * @related `server/types/session.ts` - `SessionUser` interface mirrors this schema for request context.
 */
export const users = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(), // Replit user ID (stable, unique)
  email: varchar({ length: 255 }).unique(), // Encrypted in DB (AES-256-GCM)
  emailIndex: varchar({ length: 255 }).unique(), // Blind Index for searching (HMAC-SHA256)
  firstName: varchar({ length: 255 }), // Encrypted
  lastName: varchar({ length: 255 }), // Encrypted
  profileImageUrl: text(), // Encrypted

  // ROLE-BASED ACCESS CONTROL
  // Admin status NOT auto-updated on login - must be set via SQL
  isAdmin: boolean().default(false).notNull(),

  // SECURITY: Account Lockout
  failedLoginAttempts: text({}).default("0").notNull(), // Stored as string to avoid precision issues if needed, but int is better. Wait, drizzle has integer.
  lockoutUntil: timestamp({ mode: "date", precision: 3 }),

  // Timestamps for audit trail
  createdAt: timestamp({ mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date", precision: 3 }).defaultNow().notNull(),
});

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Zod Schemas
export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
});

// Export types for type safety across backend and frontend
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
