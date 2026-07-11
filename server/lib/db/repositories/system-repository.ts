import { type AuditLog, auditLogs, type InsertAuditLog } from "@run-remix/shared";
import { desc, sql } from "drizzle-orm";
import { db } from "../../../db.js";
import { decrypt } from "../../encryption.js";
import { logger } from "../../monitoring/logger.js";
import { StorageSingleton } from "../../storage-singleton.js";

/** @public */ export class SystemRepository {
  /**
   * Pings the database to verify connectivity
   */
  async ping(): Promise<void> {
    await db.execute(sql`SELECT 1`);
  }

  /**
   * Executes a database sleep for debugging
   */
  async executeSleep(duration: number): Promise<void> {
    await db.execute(sql`SELECT pg_sleep(${duration})`);
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getRecentAuditLogs(limit);
    }
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
    return logs.map((log) => this.decryptAuditLog(log));
  }

  /**
   * Create a new audit log
   */
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createAuditLog(log);
    }
    const [created] = await db.insert(auditLogs).values(log).returning();
    if (!created) {
      throw new Error("Failed to create audit log");
    }
    return created;
  }

  /**
   * System settings stubs (to be expanded as needed)
   */
  setAuditTrailEnabled(enabled: boolean): void {
    logger.info(`[SystemRepo] Audit trail ${enabled ? "enabled" : "disabled"}`);
  }

  configureTrackedTables(tables: string[]): void {
    logger.info(`[SystemRepo] Audit trail configured for tables: ${tables.join(", ")}`);
  }

  /**
   * Helper to decrypt sensitive audit log fields
   */
  private decryptAuditLog(log: AuditLog): AuditLog {
    return {
      ...log,
      userEmail: log.userEmail ? this.safeDecrypt(log.userEmail) : log.userEmail,
      ipAddress: log.ipAddress ? this.safeDecrypt(log.ipAddress) : log.ipAddress,
      userAgent: log.userAgent ? this.safeDecrypt(log.userAgent) : log.userAgent,
    };
  }

  private safeDecrypt(value: string): string {
    if (!value?.includes(":")) return value;
    try {
      return decrypt(value);
    } catch {
      return value;
    }
  }
}

export const systemRepository = new SystemRepository();
