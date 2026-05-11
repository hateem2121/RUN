import { Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/monitoring/logger.js";
import { redis } from "../../lib/cache/upstash-client.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

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
 * PC-602: Stores vitals in Redis for persistence and analysis
 */
router.post("/vitals", writeRateLimiter, async (req, res) => {
  try {
    const metric = WebVitalSchema.parse(req.body);
    const userAgent = req.get("User-Agent");
    const ip = req.ip;

    // Log the metric for observability
    logger.info(`[Client-Vitals] ${metric.name}: ${metric.value} (id: ${metric.id})`, {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_id: metric.id,
      user_agent: userAgent,
      ip: ip,
    });

    // PC-602: Persist to Redis
    // We store as a list and trim to keep the latest 1000 records per metric type
    const listKey = `vitals:${metric.name}`;
    const payload = JSON.stringify({
      ...metric,
      timestamp: Date.now(),
      userAgent,
      ip
    });

    await redis.lpush(listKey, payload);
    await redis.ltrim(listKey, 0, 999);

  } catch (err) {
    logger.error("[Analytics] Failed to process vitals:", err);
  }

  res.status(202).end(); // Accepted
});

export default router;
