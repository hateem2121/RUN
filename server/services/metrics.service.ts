import { type Result, ResultAsync } from "neverthrow";
import { getPoolMetrics } from "../db.js";
import { queryPerformanceMonitor } from "../lib/db/query-performance.js";
import { AppError, DatabaseError } from "../lib/errors.js";

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
    return ResultAsync.fromPromise(
      (async (): Promise<{ averageResponseTime: number; currentConcurrentQueries: number }> => {
        const dbStats = queryPerformanceMonitor.getPerformanceStats();
        const poolMetrics = getPoolMetrics();

        return {
          averageResponseTime: dbStats.averageResponseTime,
          currentConcurrentQueries: poolMetrics.currentConcurrentQueries,
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to get database metrics", { cause: error });
      },
    );
  }
}

export const metricsService = MetricsService.getInstance();
