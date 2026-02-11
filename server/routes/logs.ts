import express from "express";
import { z } from "zod";
import { logger } from "../lib/monitoring/logger.js";
import type { RequestWithCorrelation } from "../middleware/correlation-id.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const ClientErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
  level: z.enum(["error", "warn", "info"]),
  context: z.record(z.string(), z.unknown()).optional(),
});

// Priority 2: Rate limit client error reporting to prevent abuse
const errorReportLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  max: 10, // 10 errors per IP per minute
  keyPrefix: "rl:client-logs",
});

// prettier-ignore
router.post("/error", errorReportLimiter, async (req, res) => {
  // security (public)
  try {
    const errorData = ClientErrorSchema.parse(req.body);

    logger.error(`[Client ${errorData.level}] ${errorData.message}`, {
      type: "client_error",
      ...errorData,
      correlationId: (req as RequestWithCorrelation).correlationId,
    });

    res.status(204).send();
  } catch (error) {
    logger.warn("Invalid client error report", { error });
    res.status(400).json({ error: "Invalid error format" });
  }
});

export default router;
