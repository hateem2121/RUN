import os from "node:os";
import { type Request, type Response, Router } from "express";
import { logger } from "../../lib/monitoring/logger.js";
import { jobMetricsService } from "../../services/job-metrics.service.js";
import { systemService } from "../../services/system.service.js";

const router = Router();

interface HealthServices {
  database: { status: string; latencyMs: number };
  memory: { status: string; usage: number; limit: number };
  system: { uptime: number; loadAvg: number[] };
  jobs?: Record<string, any>;
}

router.get("/deep", async (_req: Request, res: Response) => {
  const health: { status: string; timestamp: string; services: HealthServices } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "unknown", latencyMs: 0 },
      memory: { status: "unknown", usage: 0, limit: 120 * 1024 * 1024 }, // 120MB limit
      system: { uptime: os.uptime(), loadAvg: os.loadavg() },
      jobs: {},
    },
  };

  // Database Check (Pooled)
  const dbStart = performance.now();
  const dbResult = await systemService.checkDatabaseConnectivity();
  health.services.database.latencyMs = Math.round(performance.now() - dbStart);

  if (dbResult.isOk()) {
    health.services.database.status = "up";
  } else {
    health.services.database.status = "down";
    health.status = "unhealthy";
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

  // Job Metrics
  health.services.jobs = await jobMetricsService.getQueueHealth();
  // Trigger prometheus gauge update
  jobMetricsService
    .updateMetrics()
    .catch((err) => logger.error("[Health] Failed to update job metrics", err));

  const statusCode = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
