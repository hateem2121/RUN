import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";

interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log all serverside errors
  if (statusCode >= 500) {
    logger.error(`[GlobalErrorHandler] ${message}`, {
      error: err,
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
    });
  }

  // Send JSON response
  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : message,
    code: err.code || "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
