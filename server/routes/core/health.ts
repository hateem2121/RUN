import os from "node:os";
import { sql } from "drizzle-orm";
import { type Request, type Response, Router } from "express";
import { db } from "../../db.js";
import { logger } from "../../lib/monitoring/logger.js";

const router = Router();

interface HealthServices {
  database: { status: string; latencyMs: number };
  memory: { status: string; usage: number; limit: number };
  system: { uptime: number; loadAvg: number[] };
  directDatabase?: { status: string; latencyMs?: number; note?: string };
}

router.get("/deep", async (_req: Request, res: Response) => {
  const health: { status: string; timestamp: string; services: HealthServices } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "unknown", latencyMs: 0 },
      memory: { status: "unknown", usage: 0, limit: 120 * 1024 * 1024 }, // 120MB limit
      system: { uptime: os.uptime(), loadAvg: os.loadavg() },
    },
  };

  // Database Check (Pooled)
  const dbStart = performance.now();
  await db.execute(sql`SELECT 1`);
  health.services.database.latencyMs = Math.round(performance.now() - dbStart);
  health.services.database.status = "up";

  // Database Check (Direct - for LISTEN/NOTIFY)
  const dbConfig = (await import("../../config/environment.js")).database;
  if (dbConfig.directUrl) {
    const directStart = performance.now();
    try {
      // Use the shared pooled connection even for "direct" checks if possible,
      // or strictly manage a singleton pool. For now, we reuse the persistent 'db'
      // because instantiating a new Client() per request is a critical leak.
      // If we REALLY need to bypass pgbouncer for LISTEN/NOTIFY, we should use a
      // singleton listener, not a per-request probe.
      // For health checks, measuring the pool's health is usually sufficient.
      //
      // However, if the user explicitly wants to test the direct connection:
      // We will perform a lightweight check without opening a new connection if possible,
      // or accepting that this specific 'deep' check is expensive and infrequent.
      //
      // BETTER FIX: Use the existing `db` for all health checks, assuming `db`
      // is configured correctly.
      await db.execute(sql`SELECT 1`); // Re-using db to avoid leak

      health.services.directDatabase = {
        status: "up",
        latencyMs: Math.round(performance.now() - directStart),
        note: "Checked via shared pool to prevent connection leaks",
      };
    } catch (error) {
      health.services.directDatabase = { status: "down" };
      health.status = "degraded";
      logger.error("Health Check: Direct database failed", error as Error);
    }
  }

  // Memory Check
  const used = process.memoryUsage().heapUsed;
  health.services.memory.usage = used;
  if (used > health.services.memory.limit) {
    health.services.memory.status = "critical";
    health.status = "unhealthy";
    logger.warn(`Health Check: High memory usage (${Math.round(used / 1024 / 1024)}MB)`);
  } else {
    health.services.memory.status = "ok";
  }

  const statusCode = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
