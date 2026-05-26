import { Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/monitoring/logger.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

const ClientErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  level: z.enum(["error", "warn", "info"]),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  isRetry: z.boolean().optional(),
  retryCount: z.number().optional(),
});

/**
 * POST /api/logs/error
 * Receives caught client-side errors from entry.client.tsx and GlobalErrorBoundary.tsx
 */
router.post("/error", writeRateLimiter, (req, res) => {
  // Respond immediately to the client
  res.status(202).json({ success: true, message: "Error logged successfully" });

  // Process in the background to avoid blocking request thread
  (async () => {
    try {
      const metric = ClientErrorSchema.parse(req.body);

      const metadata = {
        url: metric.url,
        userAgent: metric.userAgent,
        componentStack: metric.componentStack,
        context: metric.context,
        timestamp: metric.timestamp || new Date().toISOString(),
        isRetry: metric.isRetry,
        retryCount: metric.retryCount,
      };

      const logMsg = `[Client-Error] ${metric.message}`;

      if (metric.level === "error") {
        const errObj = new Error(metric.message);
        if (metric.stack) {
          errObj.stack = metric.stack;
        }
        logger.error(logMsg, metadata, errObj);
      } else if (metric.level === "warn") {
        logger.warn(logMsg, metadata);
      } else {
        logger.info(logMsg, metadata);
      }
    } catch (err) {
      // Don't leak back to client since we already returned 202
      logger.error("[LogsService] Failed to parse and log client error", err as Error);
    }
  })();
});

export default router;
