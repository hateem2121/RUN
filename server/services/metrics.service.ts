import { err, ok, type Result } from "neverthrow";
import { getPoolMetrics } from "../db.js";
import { queryPerformanceMonitor } from "../lib/db/query-performance.js";
import { type AppError, DatabaseError } from "../lib/errors.js";

class MetricsService {
  private static instance: MetricsService;

  private constructor() {}

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  public async getDatabaseMetrics(): Promise<
    Result<{ averageResponseTime: number; currentConcurrentQueries: number }, AppError>
  > {
    try {
      const dbStats = queryPerformanceMonitor.getPerformanceStats();
      const poolMetrics = getPoolMetrics();

      return ok({
        averageResponseTime: dbStats.averageResponseTime,
        currentConcurrentQueries: poolMetrics.currentConcurrentQueries,
      });
    } catch (error) {
      return err(new DatabaseError("Failed to get database metrics", { cause: error }));
    }
  }
}

export const metricsService = MetricsService.getInstance();
