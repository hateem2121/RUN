import type { NextFunction, Request, Response } from "express";
import { httpRequestDurationMicroseconds, httpRequestsTotal } from "../lib/prometheus.js";

export function prometheusMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    const status_code = res.statusCode.toString();

    // Observe duration in seconds
    httpRequestDurationMicroseconds.labels(req.method, route, status_code).observe(duration / 1000);

    // Increment request counter
    httpRequestsTotal.labels(req.method, route, status_code).inc();
  });

  next();
}
