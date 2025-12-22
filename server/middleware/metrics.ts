import type { Request, Response } from "express";
import { collectDefaultMetrics, register } from "prom-client";
import { logger } from "../lib/smart-logger.js";

// Init default metrics
try {
  collectDefaultMetrics();
} catch (error) {
  logger.warn("Failed to collect default metrics", error);
}

export const metricsEndpoint = async (_req: Request, res: Response) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error("Failed to generate metrics", error as Error);
    res.status(500).end();
  }
};
