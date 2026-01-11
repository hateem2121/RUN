/**
 * Prometheus Metrics Endpoint
 * Exposes Node.js and application metrics in Prometheus format
 */

import { Router } from "express";
import { logger } from "../lib/monitoring/logger.js";

const router = Router();

/**
 * GET /metrics
 * Prometheus-compatible metrics endpoint
 * Protected by METRICS_SECRET or HEALTH_CHECK_SECRET
 */
router.get("/", async (req, res) => {
  const secret = process.env.METRICS_SECRET || process.env.HEALTH_CHECK_SECRET;
  const providedSecret = req.headers["x-metrics-key"] || req.query.key;

  if (secret && providedSecret !== secret) {
    logger.warn(`[Metrics] Unauthorized access attempt from ${req.ip}`);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Dynamic import to avoid loading prom-client if not used
    const { register } = await import("prom-client");
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    logger.error("[Metrics] Failed to generate metrics", error);
    res.status(500).json({ error: "Metrics unavailable" });
  }
});

export default router;
