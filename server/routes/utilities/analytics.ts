import { Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/monitoring/logger.js";

const router = Router();

const WebVitalSchema = z.object({
  name: z.string(),
  value: z.number(),
  delta: z.number(),
  id: z.string(),
});

/**
 * POST /api/analytics/vitals
 * Receives Core Web Vitals from the client
 */
router.post("/vitals", (req, res) => {
  try {
    const metric = WebVitalSchema.parse(req.body);

    // Log the metric for observability
    // In a full implementation, this could be sent to BigQuery, Prometheus, or a dedicated analytics DB
    logger.info(`[Client-Vitals] ${metric.name}: ${metric.value} (id: ${metric.id})`, {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_id: metric.id,
      user_agent: req.get("User-Agent"),
      ip: req.ip,
    });

    res.status(202).end(); // Accepted
  } catch (error) {
    // Fail silently to avoid interrupting the client, but log for debugging
    logger.warn("[Analytics] Received invalid web-vitals payload", { error });
    res.status(400).end();
  }
});

export default router;
