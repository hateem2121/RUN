import type { AuditLog, InsertAuditLog } from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { getPoolMetrics } from "../db.js";
import { AppError, InternalError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { systemRepository } from "./repositories/index.js";

/**
 * Service for system-level operations (Audit logs, Settings)
 * Enforces Result-based patterns and circuit breaker protection
 */
class SystemService {
  /**
   * Retrieves recent audit logs
   */
  async getRecentAuditLogs(limit = 100): Promise<Result<AuditLog[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AuditLog[], AppError>> => {
        const logs = await withCircuit(
          "get-audit-logs",
          () => systemRepository.getRecentAuditLogs(limit),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(logs);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[SystemService] Failed to fetch audit logs", error as Error);
        return err(new InternalError("Failed to fetch audit logs", { error }));
      }),
    );
  }

  /**
   * Creates a new audit log
   */
  async createAuditLog(log: InsertAuditLog): Promise<Result<AuditLog, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AuditLog, AppError>> => {
        const created = await withCircuit(
          "create-audit-log",
          () => systemRepository.createAuditLog(log),
          DB_CIRCUIT_OPTIONS,
        );
        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (created.isErr()) return err(created.error as any);
        return ok(created.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[SystemService] Failed to create audit log", error as Error);
        return err(new InternalError("Failed to create audit log", { error }));
      }),
    );
  }

  /**
   * Configures audit trail settings
   */
  async configureAuditTrail(settings: {
    enabled: boolean;
    tables?: string[];
  }): Promise<Result<void, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<void, AppError>> => {
        if (settings.enabled !== undefined) {
          systemRepository.setAuditTrailEnabled(settings.enabled);
        }
        if (settings.tables) {
          systemRepository.configureTrackedTables(settings.tables);
        }
        return ok(undefined);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[SystemService] Failed to configure audit trail", error as Error);
        return err(new InternalError("Failed to configure audit trail", { error }));
      }),
    );
  }

  /**
   * Checks database connectivity (SELECT 1)
   */
  async checkDatabaseConnectivity(): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        await withCircuit(
          "db-connectivity-check",
          () => systemRepository.ping(),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(true);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Database connectivity check failed", { error }));
      }),
    );
  }

  /**
   * Simulates a slow query (DEBUG ONLY)
   */
  async simulateSlowQuery(duration: number): Promise<Result<void, AppError>> {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEBUG_ROUTES !== "true") {
      return err(new InternalError("Debug operations not allowed in production"));
    }
    return new ResultAsync(
      (async (): Promise<Result<void, AppError>> => {
        await withCircuit(
          "simulate-slow-query",
          () => systemRepository.executeSleep(duration),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(undefined);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Slow query simulation failed", { error }));
      }),
    );
  }

  /**
   * Retrieves database connection pool metrics
   */
  getPoolMetrics() {
    return getPoolMetrics();
  }
}

export const systemService = new SystemService();
