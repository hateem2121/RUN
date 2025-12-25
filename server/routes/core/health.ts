import { sql } from "drizzle-orm";
import { type Request, type Response, Router } from "express";
import os from "os";
import { db } from "../../db.js";
import { logger } from "../../lib/smart-logger.js";

const router = Router();

router.get("/deep", async (_req: Request, res: Response) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "unknown", latencyMs: 0 },
      memory: { status: "unknown", usage: 0, limit: 120 * 1024 * 1024 }, // 120MB limit
      system: { uptime: os.uptime(), loadAvg: os.loadavg() },
    },
  };

  // Database Check
  const dbStart = performance.now();
  try {
    await db.execute(sql`SELECT 1`);
    health.services.database.latencyMs = Math.round(performance.now() - dbStart);
    health.services.database.status = "up";
  } catch (error) {
    health.services.database.status = "down";
    health.status = "degraded";
    logger.error("Health Check: Database failed", error as Error);
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
