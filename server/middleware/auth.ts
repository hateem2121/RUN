/**
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 *
 * Middleware Functions:
 * - requireAdmin: Checks is_admin flag with 5-min cache
 * - clearAdminCacheHandler: Endpoint to manually clear cache
 * - getAdminCacheStatsHandler: Cache statistics for monitoring
 *
 * Reference: https://docs.replit.com/hosting/deployments/replit-authn
 *
 * ✓ CHECKPOINT: PHASE-3-AUTH-MIDDLEWARE
 */

import type { RequestHandler } from "express";
import { adminCacheManager } from "../lib/admin-cache.js";
import { logger } from "../lib/smart-logger.js";
import { getStorage } from "../lib/storage-singleton.js";

/**
 * AUTH ERROR TYPES
 * Provides specific, user-friendly error messages
 */
export const AuthErrors = {
  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    message: "Your session has expired. Please log in again.",
    status: 401,
  },
  ADMIN_REQUIRED: {
    code: "ADMIN_REQUIRED",
    message: "Admin privileges are required to access this resource.",
    status: 403,
  },
  AUTH_SERVER_ERROR: {
    code: "AUTH_SERVER_ERROR",
    message: "Authentication server is temporarily unavailable. Please try again.",
    status: 503,
  },
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User account not found. Please contact support.",
    status: 404,
  },
  INVALID_SESSION: {
    code: "INVALID_SESSION",
    message: "Invalid session. Please log in again.",
    status: 401,
  },
} as const;

/**
 * Middleware: Require admin role
 *
 * Flow:
 * 1. Check authentication (via session)
 * 2. Check cache for admin status (0ms NEON time)
 * 3. On cache miss: Query NEON database (~20ms)
 * 4. Cache result for 5 minutes
 * 5. Return 403 if not admin, 401 if not authenticated
 *
 * Cost Optimization: ~95% of requests hit cache (0ms NEON active time)
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Check 1: Must be authenticated
  if (!req.isAuthenticated() || !user?.claims?.sub) {
    logger.warn(
      `[Security] Unauthorized access attempt to ${req.originalUrl || req.path} from IP: ${req.ip}`,
    );
    return res.status(AuthErrors.SESSION_EXPIRED.status).json({
      error: AuthErrors.SESSION_EXPIRED,
      redirectTo: "/api/login",
    });
  }

  const userId = user.claims.sub;

  // Check 2: Cache lookup (fast path - 0ms NEON time)
  const cachedAdminStatus = adminCacheManager.get(userId);
  if (cachedAdminStatus !== null) {
    if (cachedAdminStatus) {
      logger.debug(`[Auth] Admin access granted from cache for user ${userId}`);
      return next(); // Admin confirmed from cache
    } else {
      logger.warn(`[Auth] Non-admin access denied for user ${userId} (cached)`);
      return res.status(AuthErrors.ADMIN_REQUIRED.status).json({
        error: AuthErrors.ADMIN_REQUIRED,
      });
    }
  }

  // Check 3: Database query (slow path - ~20ms NEON time)
  try {
    const dbUser = await getStorage().getUser(userId);

    if (!dbUser) {
      logger.error(`[Auth] User ${userId} authenticated but not found in database`);
      return res.status(AuthErrors.USER_NOT_FOUND.status).json({
        error: AuthErrors.USER_NOT_FOUND,
      });
    }

    const isAdmin = dbUser.isAdmin ?? false;

    // Cache result for 5 minutes
    adminCacheManager.set(userId, isAdmin);

    if (isAdmin) {
      logger.info(`[Auth] Admin access granted for user ${userId} (DB query)`);
      return next();
    } else {
      logger.warn(
        `[Security] Non-admin user ${userId} attempted admin action: ${req.method} ${req.path}`,
      );
      return res.status(AuthErrors.ADMIN_REQUIRED.status).json({
        error: AuthErrors.ADMIN_REQUIRED,
      });
    }
  } catch (error) {
    logger.error("[Auth] Error checking admin status:", error);
    return res.status(AuthErrors.AUTH_SERVER_ERROR.status).json({
      error: AuthErrors.AUTH_SERVER_ERROR,
    });
  }
};

/**
 * Admin cache management endpoint (POST /api/admin/cache/clear)
 * Protected by requireAdmin (must be admin to clear cache)
 *
 * Body (optional):
 * - { userId: "12345" } - Clear specific user
 * - {} - Clear all users
 */
export const clearAdminCacheHandler: RequestHandler = async (req, res) => {
  const { userId } = req.body;

  if (userId) {
    // Clear specific user
    adminCacheManager.clearUser(userId);
    return res.json({
      success: true,
      message: `Admin cache cleared for user ${userId}`,
    });
  } else {
    // Clear all
    adminCacheManager.clear();
    return res.json({
      success: true,
      message: "Admin cache cleared for all users",
    });
  }
};

/**
 * Admin cache stats endpoint (GET /api/admin/cache/stats)
 * Returns cache statistics for monitoring
 */
export const getAdminCacheStatsHandler: RequestHandler = async (_req, res) => {
  const stats = adminCacheManager.getStats();
  return res.json({
    ...stats,
    timestamp: new Date().toISOString(),
  });
};
