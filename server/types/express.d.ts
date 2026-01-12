/**
 * Express Request Type Augmentation
 * 
 * Extends Express Request.user with actual User schema from database.
 * This enables type-safe access to user properties across all routes.
 */

import type { User } from "../../shared/schema/users.js";

declare global {
  namespace Express {
    // Extend the User interface with our database User type
    // This provides type safety for req.user.id, req.user.email, etc.
    interface User extends Omit<import("../../shared/schema/users.js").User, never> {}
  }
}

export {};
