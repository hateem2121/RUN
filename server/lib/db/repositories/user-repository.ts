/**
 * User Repository
 * Handles user authentication and profile operations
 */

import { eq } from "drizzle-orm";
import type { UpsertUser, User } from "../../../../shared/index.js";
import { users } from "../../../../shared/index.js";
import { db } from "../../../db.js";
import { decrypt, encrypt, getBlindIndex } from "../../encryption.js";
import { logger } from "../../monitoring/logger.js";

export class UserRepository {
  /**
   * Get user by user ID
   * Cost Optimization: No cache needed - middleware caches admin status
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? this.decryptUser(user) : undefined;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const index = getBlindIndex(email);
    const [user] = await db.select().from(users).where(eq(users.emailIndex, index));
    return user ? this.decryptUser(user) : undefined;
  }

  /**
   * Upsert user on login (create or update profile data)
   *
   * IMPORTANT: isAdmin flag is NOT updated on conflict
   * Admin promotion must be done manually via SQL to prevent privilege escalation
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    const encryptedData = {
      ...userData,
      email: userData.email ? encrypt(userData.email) : userData.email,
      emailIndex: userData.email ? getBlindIndex(userData.email) : null,
      firstName: userData.firstName ? encrypt(userData.firstName) : userData.firstName,
      lastName: userData.lastName ? encrypt(userData.lastName) : userData.lastName,
      profileImageUrl: userData.profileImageUrl
        ? encrypt(userData.profileImageUrl)
        : userData.profileImageUrl,
    };

    const [user] = await db
      .insert(users)
      .values({
        ...encryptedData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: encryptedData.email,
          emailIndex: encryptedData.emailIndex,
          firstName: encryptedData.firstName,
          lastName: encryptedData.lastName,
          profileImageUrl: encryptedData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!user) {
      throw new Error("Failed to upsert user - no user returned from database");
    }

    return this.decryptUser(user);
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
   * Update user details
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(): Promise<User[]> {
    const adminUsers = await db.select().from(users).where(eq(users.isAdmin, true));
    return adminUsers.map((user) => this.decryptUser(user));
  }

  /**
   * Helper to decrypt sensitive user fields
   */
  private decryptUser(user: User): User {
    try {
      return {
        ...user,
        email: user.email ? this.safeDecrypt(user.email) : user.email,
        firstName: user.firstName ? this.safeDecrypt(user.firstName) : user.firstName,
        lastName: user.lastName ? this.safeDecrypt(user.lastName) : user.lastName,
        profileImageUrl: user.profileImageUrl
          ? this.safeDecrypt(user.profileImageUrl)
          : user.profileImageUrl,
      };
    } catch (error) {
      logger.error(`[UserRepository] Failed to decrypt user ${user.id}:`, error);
      return user; // Fallback to raw data
    }
  }

  /**
   * Safely attempt decryption, fallback to original if it doesn't look like encrypted text
   */
  private safeDecrypt(value: string): string {
    if (!value || !value.includes(":")) return value;
    try {
      return decrypt(value);
    } catch {
      return value;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
