import { Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/monitoring/logger.js";
import { apiTier } from "../../middleware/rate-limit-tiers.js";
import { authService } from "../../services/system/auth.service.js";

const router = Router();
router.use(apiTier);

const WebVitalSchema = z.object({
  name: z.string(),
  value: z.number(),
  delta: z.number(),
  id: z.string(),
});

interface StoredVital {
  name: string;
  value: number;
  delta: number;
  id: string;
  timestamp: number;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

// In-memory ring buffer per metric for fast local diagnostics
const vitalsStore = new Map<string, StoredVital[]>();
const MAX_VITALS_PER_METRIC = 100;

/** Core Web Vital metric names tracked by the client */
const VITAL_METRIC_NAMES = ["LCP", "CLS", "INP", "FCP", "TTFB"] as const;

// Core Web Vitals beacon: receives telemetry from client browsers
router.post("/vitals", (req, res) => {
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

    const payload: StoredVital = {
      ...metric,
      timestamp: Date.now(),
      userAgent,
      ip,
    };

    const existing = vitalsStore.get(metric.name) || [];
    existing.unshift(payload);
    if (existing.length > MAX_VITALS_PER_METRIC) {
      existing.length = MAX_VITALS_PER_METRIC;
    }
    vitalsStore.set(metric.name, existing);
  })().catch((err) => {
    logger.error("[Analytics] Failed to process vitals in background:", err);
  });
});

/**
 * GET /api/analytics/vitals
 * OB-703: Retrieves stored Web Vitals (admin-only).
 * Returns the last 100 entries per metric as JSON.
 */
router.get("/vitals", authService.requireAdmin, async (_req, res) => {
  const results: Record<string, StoredVital[]> = {};

  for (const metric of VITAL_METRIC_NAMES) {
    results[metric] = vitalsStore.get(metric) || [];
  }

  res.json({
    status: "ok",
    metrics: results,
    retrievedAt: new Date().toISOString(),
  });
});

export default router;
