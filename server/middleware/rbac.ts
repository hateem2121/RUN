import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";
import { adminService as defaultAdminService } from "../services/admin/admin.service.js";
import { AuthErrors, authService } from "../services/auth-service.js";
import type { SessionUser } from "../types/session.js";

// Boot-time assertion: RBAC bypass must never ship to production.
if (process.env.NODE_ENV === "production" && process.env.BYPASS_RBAC_FOR_TESTING === "true") {
  throw new Error("CRITICAL SECURITY ERROR: BYPASS_RBAC_FOR_TESTING must be false in production.");
}

/**
 * Role-Based Access Control Middleware
 * Enforces role restrictions at the route level.
 * @param allowedRoles List of roles allowed to access the route
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Get the admin service from app context (for tests) or fallback to singleton
    const adminService = req.app?.get("adminService") || defaultAdminService;
    // 0. Test-only bypass — only honored outside production (boot assertion above guards prod).
    if (process.env.BYPASS_RBAC_FOR_TESTING === "true" && process.env.NODE_ENV !== "production") {
      logger.warn(
        "[RBAC] ⚠️ Role check bypassed via BYPASS_RBAC_FOR_TESTING flag. THIS SHOULD NEVER HAPPEN IN PRODUCTION.",
      );
      return next();
    }

    // 1. Authentication check
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as SessionUser;

    // 2. Role check
    // Assuming user.role or user.claims.role exists.
    // Based on SessionUser definition, we might need to fetch it or rely on claims.
    // For now, checking 'isAdmin' boolean which is common, or specific role field.
    // Adapting to current system:
    // If asking for 'admin' and user.isAdmin is true -> pass.

    // Let's assume we want to standardise on "roles" string eventually.
    // But right now we check mappings.

    let hasRole = false;

    for (const role of allowedRoles) {
      if (role === "admin") {
        const result = await authService.verifyAdminAccess(user);
        if (result.isOk() && result.value) {
          hasRole = true;
          break;
        }
      } else {
        // Generic role checking
        if (
          (user.claims as { role?: string })?.role === role ||
          (user as { role?: string }).role === role
        ) {
          hasRole = true;
          break;
        }
      }
    }

    if (!hasRole) {
      // 3. SEC-F04: Audit Log - Access Denied
      try {
        await adminService.logAudit({
          action: "ACCESS_DENIED",
          tableName: "route",
          recordId: req.path,
          user: user,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
          metadata: {
            requiredRoles: allowedRoles,
            userRole: user.isAdmin ? "admin" : "user",
          },
        });
      } catch (err) {
        logger.error("[RBAC] Failed to log access denial:", err);
      }

      return res.status(AuthErrors.ADMIN_REQUIRED.status).json({
        error: AuthErrors.ADMIN_REQUIRED,
        message: "Insufficient permissions",
      });
    }

    return next();
  };
}

/**
 * OBJECT-LEVEL AUTHORIZATION HELPERS (OWASP A01)
 * These should be used within services or routes to verify if a user
 * can perform an action on a specific resource instance.
 */

/**
 * Verify if a user is the owner of a resource or an admin.
 */
export function canManageResource(user: SessionUser, resourceOwnerId: string | undefined): boolean {
  if (!resourceOwnerId) return false;

  // Admins can manage everything
  if (user.isAdmin) return true;

  // For now, if the sub (user ID) matches, it's the owner
  return user.claims.sub === resourceOwnerId;
}
