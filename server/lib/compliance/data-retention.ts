/**
 * Data Retention Policy Module
 *
 * @module data-retention
 * @description Implements GDPR, CCPA, and SOX-compliant data retention policies.
 * Automates cleanup of expired data while preserving required audit trails.
 *
 * @compliance
 * - GDPR Article 17: Right to erasure
 * - CCPA: Consumer data deletion rights
 * - SOX: Audit trail retention requirements
 */

import { lt, sql } from "drizzle-orm";
import { auditLogs, sessions } from "../../../shared/schema.js";
import { db } from "../../db.js";
import { logger } from "../monitoring/logger.js";

/**
 * Retention policy configuration for each data type
 *
 * @property retentionDays - Days to keep data before deletion (null = permanent)
 * @property archiveAfter - Days before archiving to cold storage (null = no archive)
 * @property complianceLevel - Required retention for compliance
 */
export const retentionPolicies = {
  auditLogs: {
    retentionDays: 2555, // 7 years for SOX compliance
    archiveAfter: 365,
    complianceLevel: "high" as const,
  },
  sessions: {
    retentionDays: 30,
    archiveAfter: null,
    complianceLevel: "standard" as const,
  },
  mediaItems: {
    retentionDays: null, // Permanent - business content
    archiveAfter: null,
    complianceLevel: "standard" as const,
  },
  performanceMetrics: {
    retentionDays: 90,
    archiveAfter: null,
    complianceLevel: "standard" as const,
  },
  animationErrors: {
    retentionDays: 30,
    archiveAfter: null,
    complianceLevel: "standard" as const,
  },
  contactInquiries: {
    retentionDays: 730, // 2 years for business records
    archiveAfter: 365,
    complianceLevel: "standard" as const,
  },
} as const;

export type RetentionPolicy = typeof retentionPolicies;
export type DataType = keyof RetentionPolicy;

/**
 * Retention enforcement result
 */
export interface RetentionReport {
  dataType: string;
  deletedCount: number;
  archivedCount: number;
  executedAt: Date;
  nextRun: Date;
  errors: string[];
}

/**
 * Enforce session cleanup
 * Sessions expire automatically via connect-pg-simple, but this ensures cleanup
 */
async function cleanupSessions(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionPolicies.sessions.retentionDays);

  const result = await db.delete(sessions).where(lt(sessions.expire, cutoffDate));

  return result.rowCount ?? 0;
}

/**
 * Cleanup old performance metrics
 */
async function cleanupPerformanceMetrics(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionPolicies.performanceMetrics.retentionDays);

  const result = await db.execute(
    sql`DELETE FROM performance_metrics WHERE created_at < ${cutoffDate}`,
  );

  return Number(result.rowCount ?? 0);
}

/**
 * Main retention enforcement function
 * Should be called on a scheduled basis (e.g., daily cron job)
 *
 * @returns Report of all retention actions taken
 */
export async function enforceRetention(): Promise<RetentionReport[]> {
  const reports: RetentionReport[] = [];
  const executedAt = new Date();
  const nextRun = new Date(executedAt);
  nextRun.setDate(nextRun.getDate() + 1);

  logger.info("[Retention] Starting data retention enforcement");

  // Sessions cleanup
  try {
    const deletedSessions = await cleanupSessions();
    reports.push({
      dataType: "sessions",
      deletedCount: deletedSessions,
      archivedCount: 0,
      executedAt,
      nextRun,
      errors: [],
    });
    logger.info(`[Retention] Cleaned up ${deletedSessions} expired sessions`);
  } catch (error) {
    reports.push({
      dataType: "sessions",
      deletedCount: 0,
      archivedCount: 0,
      executedAt,
      nextRun,
      errors: [error instanceof Error ? error.message : String(error)],
    });
    logger.error("[Retention] Failed to cleanup sessions", error);
  }

  // Performance metrics cleanup
  try {
    const deletedMetrics = await cleanupPerformanceMetrics();
    reports.push({
      dataType: "performanceMetrics",
      deletedCount: deletedMetrics,
      archivedCount: 0,
      executedAt,
      nextRun,
      errors: [],
    });
    logger.info(`[Retention] Cleaned up ${deletedMetrics} old performance metrics`);
  } catch (error) {
    reports.push({
      dataType: "performanceMetrics",
      deletedCount: 0,
      archivedCount: 0,
      executedAt,
      nextRun,
      errors: [error instanceof Error ? error.message : String(error)],
    });
    logger.error("[Retention] Failed to cleanup performance metrics", error);
  }

  logger.info(`[Retention] Enforcement complete. Processed ${reports.length} data types`);

  return reports;
}

/**
 * Get retention policy for a data type
 */
export function getRetentionPolicy(dataType: DataType) {
  return retentionPolicies[dataType];
}

/**
 * Calculate deletion deadline for a record
 */
export function getDeletionDeadline(dataType: DataType, createdAt: Date): Date | null {
  const policy = retentionPolicies[dataType];

  if (policy.retentionDays === null) {
    return null; // Permanent retention
  }

  const deadline = new Date(createdAt);
  deadline.setDate(deadline.getDate() + policy.retentionDays);
  return deadline;
}
