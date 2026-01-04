/**
 * User Repository
 * Handles user authentication and profile operations
 */

import { eq } from "drizzle-orm";
import type { UpsertUser, User } from "../../../../shared/schema.js";
import { users } from "../../../../shared/schema.js";
import { db } from "../../../db.js";

export class UserRepository {
  /**
   * Get user by user ID
   * Cost Optimization: No cache needed - middleware caches admin status
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  /**
   * Upsert user on login (create or update profile data)
   *
   * IMPORTANT: isAdmin flag is NOT updated on conflict
   * Admin promotion must be done manually via SQL to prevent privilege escalation
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
          // NOTE: isAdmin NOT updated on conflict - must be set manually via SQL
        },
      })
      .returning();

    if (!user) {
      throw new Error("Failed to upsert user - no user returned from database");
    }

    return user;
  }

  /**
   * Update user's admin status (for manual admin operations)
   */
  async setAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isAdmin, true));
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
