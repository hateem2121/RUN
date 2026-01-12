import { sql as drizzleSql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { checkDatabaseConnection, db, getPoolMetrics } from "../../server/db";

describe("Database Metrics", () => {
  it("should track query metrics", async () => {
    const initial = getPoolMetrics();

    // Execute multiple queries
    await db.execute(drizzleSql`SELECT 1`);
    await db.execute(drizzleSql`SELECT 1`);

    const after = getPoolMetrics();

    expect(after.totalQueries).toBe(initial.totalQueries + 2);
    expect(after.successfulQueries).toBe(initial.successfulQueries + 2);
    expect(after.peakConcurrentQueries).toBeGreaterThanOrEqual(initial.peakConcurrentQueries);
  });

  it("should track concurrent queries (simulated)", async () => {
    const initial = getPoolMetrics();

    // Run concurrent queries
    // Note: Since mock is instant, concurrency might be hard to capture without delay.
    // But logic should hold.
    await Promise.all([
      db.execute(drizzleSql`SELECT 1`),
      db.execute(drizzleSql`SELECT 1`),
      db.execute(drizzleSql`SELECT 1`),
    ]);

    const after = getPoolMetrics();
    expect(after.totalQueries).toBeGreaterThan(initial.totalQueries);
    expect(after.peakConcurrentQueries).toBeGreaterThan(0);
  });

  it("should update health check timestamp", async () => {
    const start = new Date();
    await checkDatabaseConnection();
    const metrics = getPoolMetrics();

    expect(metrics.lastHealthCheckAt.getTime()).toBeGreaterThanOrEqual(start.getTime());
  });
});
