import os from "node:os";
import { type Request, type Response, Router } from "express";
import { env } from "../../lib/env.js";
import { logger } from "../../lib/monitoring/logger.js";
import { jobMetricsService } from "../../services/job-metrics.service.js";
import { systemService } from "../../services/system.service.js";

const router = Router();

interface HealthServices {
  database: { status: string; latencyMs: number };
  memory: { status: string; usage: number; limit: number };
  system: { uptime: number; loadAvg: number[] };
  // biome-ignore lint/suspicious/noExplicitAny: health check services shape
  jobs?: Record<string, any>;
}

/**
 * GET /api/health
 * Simple ping — returns 200 if process is running
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /api/health/live
 * OB-604: Kubernetes liveness probe.
 * Always returns 200 — the process is alive.
 * If this endpoint stops responding, the container should be restarted.
 */
router.get("/live", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * GET /api/health/ready
 * OB-605: Kubernetes readiness probe.
 * Returns 200 only if the database is reachable.
 * Kubernetes should route traffic away from this pod if it returns 503.
 */
router.get("/ready", async (_req: Request, res: Response) => {
  const dbResult = await systemService.checkDatabaseConnectivity();

  if (dbResult.isOk()) {
    res.json({ status: "ok", database: "up" });
  } else {
    logger.warn("[Health:Ready] Database not reachable, reporting not-ready");
    res.status(503).json({ status: "not-ready", database: "down" });
  }
});

router.get("/deep", async (_req: Request, res: Response) => {
  const memoryLimit = env.HEALTH_CHECK_MEMORY_LIMIT
    ? env.HEALTH_CHECK_MEMORY_LIMIT
    : 512 * 1024 * 1024; // 512MB default

  const health: { status: string; timestamp: string; services: HealthServices } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "unknown", latencyMs: 0 },
      memory: { status: "unknown", usage: 0, limit: memoryLimit },
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
