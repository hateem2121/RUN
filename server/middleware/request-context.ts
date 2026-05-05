import type { Request } from "express";
import type { AuditContext } from "../services/admin/admin.service.js";
import type { SessionUser } from "../types/session.js";

/**
 * Extracts audit context from an Express request object.
 * Standardizes extraction of user, user-agent, and IP for administrative audit logging.
 */
export function getAuditContext(req: Request): AuditContext {
  return {
    user: req.user as SessionUser,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };
}
