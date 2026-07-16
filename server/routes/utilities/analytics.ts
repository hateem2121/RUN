import { Router } from "express";
import { Result } from "neverthrow";
import { z } from "zod";
import { isRedisEnabled, redis } from "../../lib/cache/upstash-client.js";
import { logger } from "../../lib/monitoring/logger.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

const WebVitalSchema = z.object({
  name: z.string(),
  value: z.number(),
  delta: z.number(),
  id: z.string(),
});

/** Core Web Vital metric names tracked by the client */
const VITAL_METRIC_NAMES = ["LCP", "CLS", "INP", "FCP", "TTFB"] as const;

/**
 * POST /api/analytics/vitals
 * Receives Core Web Vitals from the client
 * PC-602: Stores vitals in Redis for persistence and analysis
 */
router.post("/vitals", writeRateLimiter, (req, res) => {
  // Respond immediately to the client
  res.status(202).end();

  // Process in background
  (async () => {
    const metric = WebVitalSchema.parse(req.body);
    const userAgent = req.get("User-Agent");
    const ip = req.ip;

    // Log the metric for observability
    logger.info(`[Client-Vitals] ${metric.name}: ${metric.value} (id: ${metric.id})`, {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_id: metric.id,
      user_agent: userAgent,
      ip: ip,
    });

    if (isRedisEnabled) {
      // PC-602: Persist to Redis
      const listKey = `vitals:${metric.name}`;
      const payload = JSON.stringify({
        ...metric,
        timestamp: Date.now(),
        userAgent,
        ip,
      });

      const timeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Redis write timeout")), 300),
      );

      await Promise.race([
        (async () => {
          await redis.lpush(listKey, payload);
          await redis.ltrim(listKey, 0, 999);
        })(),
        timeout,
      ]);
    }
  })().catch((err) => {
    logger.error("[Analytics] Failed to process vitals in background:", err);
  });
});

/**
 * GET /api/analytics/vitals
 * OB-703: Retrieves stored Web Vitals from Redis (admin-only).
 * Returns the last 100 entries per metric as JSON.
 */
router.get("/vitals", authService.requireAdmin, async (_req, res) => {
  if (!isRedisEnabled) {
    res.json({
      status: "ok",
      metrics: { LCP: [], CLS: [], INP: [], FCP: [], TTFB: [] },
      retrievedAt: new Date().toISOString(),
      fallback: true,
    });
    return;
  }

  const results: Record<string, unknown[]> = {};

  const promises = VITAL_METRIC_NAMES.map(async (metric) => {
    const listKey = `vitals:${metric}`;
    const timeout = new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 300));

    const rawEntries = await Promise.race([redis.lrange(listKey, 0, 99).catch(() => []), timeout]);

    const safeParse = Result.fromThrowable(
      (val: string) => JSON.parse(val),
      () => new Error("parse failed"),
    );

    results[metric] = (rawEntries as unknown as (string | unknown)[]).map((entry) => {
      if (typeof entry === "string") {
        return safeParse(entry).match(
          (parsed) => parsed,
          () => entry,
        );
      }
      return entry;
    });
  });

  await Promise.all(promises);

  res.json({
    status: "ok",
    metrics: results,
    retrievedAt: new Date().toISOString(),
  });
});

export default router;
