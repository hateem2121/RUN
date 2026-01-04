import { logger } from "../lib/monitoring/logger.js";

interface AuditLogParams {
  actor: {
    id: string;
    email?: string;
    ip?: string;
  };
  action: string;
  target: {
    type: string;
    id: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Structured Audit Logging Service
 * Records administrative actions for compliance and security forensics.
 * Currently logs to structured stdout (which goes to GCP/Datadog).
 * Can be extended to write to a dedicated Audit table.
 */
export function logAuditAction(params: AuditLogParams) {
  const { actor, action, target, metadata } = params;

  logger.info(`[AUDIT] ${action.toUpperCase()} on ${target.type}:${target.id} by ${actor.email}`, {
    audit: true,
    timestamp: new Date().toISOString(),
    actor,
    action,
    target,
    metadata,
  });
}
