import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, ConflictError, ValidationError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;

  // Convert ZodError (from z.parse)
  // Convert ZodError (from z.parse)
  if (error instanceof ZodError) {
    const zodError = error as ZodError;
    const message = zodError.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    // Use the existing ValidationError class
    error = new ValidationError(`Validation Error: ${message}`);
  }

  // Handle specific database errors (Postgres)
  if ((error as any).code === "23505") {
    error = new ConflictError("Duplicate entry detected");
  }

  // Handle non-AppErrors (Unexpected)
  if (!(error instanceof AppError)) {
    const statusCode = (error as any).statusCode || (error as any).status || 500;
    const message = error.message || "Internal Server Error";

    // Log unexpected errors
    logger.error(`[GlobalErrorHandler] Unexpected: ${message}`, {
      error: err,
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
    });

    // Create an InternalError or similar wrapper for consistent response
    // But for now, we construct the response manually to match AppError shape
    const prodMessage = statusCode >= 500 ? "Something went wrong" : message;

    res.status(statusCode).json({
      status: "error",
      message: process.env.NODE_ENV === "development" ? message : prodMessage,
      code: "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  // Handle AppError (Trusted)
  const appError = error as AppError;
  const isInternal = appError.statusCode >= 500;

  if (isInternal) {
    logger.error(`[GlobalErrorHandler] Operational: ${appError.message}`, {
      error: appError,
      path: req.path,
    });
  } else {
    logger.warn(`[GlobalErrorHandler] ${appError.message}`, {
      code: appError.code,
      path: req.path,
    });
  }

  res.status(appError.statusCode).json({
    status: isInternal ? "error" : "fail",
    message: appError.message,
    code: appError.code,
    details: appError.details,
    ...(process.env.NODE_ENV === "development" && { stack: appError.stack }),
  });
}
