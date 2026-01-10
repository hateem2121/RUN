import { correlationContext, logger } from "../lib/monitoring/logger.js";

// Production-Grade Error Handling
// PHASE 4: Production Readiness - Error Management

import type { ProblemDetails } from "@run-remix/shared";
import type { NextFunction, Request, Response } from "express";
import { getConfig } from "../config/production.js";
import { errorAggregator } from "../lib/monitoring/error-aggregator.js";

const config = getConfig();

// Error Classification
interface ErrorDetails {
  id: string;
  type:
    | "validation"
    | "authentication"
    | "authorization"
    | "not_found"
    | "rate_limit"
    | "internal"
    | "database"
    | "external_service";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  userAgent?: string | undefined;
  ip?: string | undefined;
  path: string;
  method: string;
}

// Generate unique error ID for tracking - safe for database integer compatibility
function generateErrorId(): string {
  // Use compact timestamp approach to stay within safe integer ranges
  const epochStart = new Date("2020-01-01").getTime();
  const compactTimestamp = Math.floor((Date.now() - epochStart) / 1000);
  const randomSuffix = Math.floor(Math.random() * 99999);
  return `err_${compactTimestamp}${randomSuffix.toString().padStart(5, "0")}`;
}

// Classify error type and severity
function classifyError(error: unknown, req: Request): ErrorDetails {
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();
  const path = req.path;
  const method = req.method;
  const userAgent = req.get("User-Agent");
  const ip = req.ip || req.connection.remoteAddress;

  let type: ErrorDetails["type"] = "internal";
  let severity: ErrorDetails["severity"] = "medium";

  // Classify by error properties
  const errorCode = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (errorCode === "ECONNREFUSED" || errorCode === "ENOTFOUND") {
    type = "external_service";
    severity = "high";
  } else if (
    error instanceof Error &&
    (error.message?.includes("database") || error.message?.includes("SQL"))
  ) {
    type = "database";
    severity = "high";
  } else if (error instanceof Error && error.name === "ZodError") {
    type = "validation";
    severity = "low";
  } else if (error && typeof error === "object" && ("status" in error || "statusCode" in error)) {
    const status = (
      "status" in error ? error.status : "statusCode" in error ? error.statusCode : 0
    ) as number;
    if (status === 404) {
      type = "not_found";
      severity = "low";
    } else if (status === 401) {
      type = "authentication";
      severity = "medium";
    } else if (status === 403) {
      type = "authorization";
      severity = "medium";
    } else if (status === 429) {
      type = "rate_limit";
      severity = "low";
    } else if (status >= 400 && status < 500) {
      type = "validation";
      severity = "low";
    }
  } else {
    type = "internal";
    severity = "critical";
  }

  return {
    id: errorId,
    type,
    severity,
    timestamp,
    userAgent,
    ip,
    path,
    method,
  };
}

// Error logging with different levels
function logError(error: unknown, details: ErrorDetails) {
  const logLevel = config.monitoring.logLevel;

  // DEBUG: Write to file
  try {
    const fs = require("node:fs");
    const logEntry = `[${new Date().toISOString()}] ${details.type.toUpperCase()} (${details.id}): ${error instanceof Error ? error.message : "Unknown error"}\nStack: ${error instanceof Error ? error.stack : "No stack"}\n\n`;
    fs.appendFileSync("error.log", logEntry);
  } catch (_e) {
    // ignore
  }

  // Record error in aggregator for metrics
  errorAggregator.recordError({
    id: details.id,
    type: details.type,
    severity: details.severity,
    message: error instanceof Error ? error.message : "Unknown error",
    timestamp: details.timestamp,
    path: details.path,
    method: details.method,
    ip: details.ip,
    userAgent: details.userAgent,
    stack: config.app.enableDebugMode && error instanceof Error ? error.stack : undefined,
  });

  // Always log critical and high severity errors
  if (details.severity === "critical" || details.severity === "high") {
    logger.error(
      `[ERROR ${details.id}] ${details.type.toUpperCase()}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    logger.error(`[ERROR ${details.id}] Path: ${details.method} ${details.path}`);
    logger.error(`[ERROR ${details.id}] IP: ${details.ip}`);

    if (config.app.enableDebugMode && error instanceof Error) {
      logger.error(`[ERROR ${details.id}] Stack:`, error.stack);
    }
  }

  // Log medium severity in development and staging
  else if (details.severity === "medium" && (logLevel === "info" || logLevel === "debug")) {
    logger.warn(
      `[WARN ${details.id}] ${details.type}: ${error instanceof Error ? error.message : "Unknown error"} (${details.path})`,
    );
  }

  // Log low severity only in debug mode
  else if (details.severity === "low" && logLevel === "debug") {
    logger.info(
      `[INFO ${details.id}] ${details.type}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Generate user-friendly error responses
export function generateErrorResponse(error: unknown, details: ErrorDetails): ProblemDetails {
  // Get request ID from correlation context
  const requestId = correlationContext.getStore() || details.id;
  const isProd = config.app.environment === "production";

  // Base Problem Details
  // RFC 7807 Standard
  const problemDetails: any = {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred",
    instance: details.path,
    requestId: requestId,
    timestamp: details.timestamp,
  };

  if (isProd) {
    switch (details.type) {
      case "validation":
        problemDetails.type = "urn:problem:validation-error";
        problemDetails.title = "Validation Failed";
        problemDetails.status = 400;
        problemDetails.detail = "The request parameters failed validation";
        if ("issues" in (error as any)) {
          problemDetails["invalid-params"] = (error as any).issues;
        }
        break;
      case "authentication":
        problemDetails.type = "urn:problem:authentication-required";
        problemDetails.title = "Authentication Required";
        problemDetails.status = 401;
        problemDetails.detail = "You must be logged in to access this resource";
        break;
      case "authorization":
        problemDetails.type = "urn:problem:access-denied";
        problemDetails.title = "Access Denied";
        problemDetails.status = 403;
        problemDetails.detail = "You do not have permission to access this resource";
        break;
      case "not_found":
        problemDetails.type = "urn:problem:not-found";
        problemDetails.title = "Resource Not Found";
        problemDetails.status = 404;
        problemDetails.detail = "The requested resource could not be found";
        break;
      case "rate_limit":
        problemDetails.type = "urn:problem:rate-limit-exceeded";
        problemDetails.title = "Rate Limit Exceeded";
        problemDetails.status = 429;
        problemDetails.detail = "Too many requests, please try again later";
        break;
      default:
        problemDetails.type = "urn:problem:internal-server-error";
        problemDetails.title = "Internal Server Error";
        problemDetails.status = 500;
        problemDetails.detail = "An unexpected server error occurred";
    }
  } else {
    // Development/Staging - Detailed
    problemDetails.type = `urn:problem:${details.type}`;
    problemDetails.title = error instanceof Error ? error.name : "Error";

    // Determine status from error object if possible
    const status =
      error && typeof error === "object" && ("status" in error || "statusCode" in error)
        ? (("status" in error
            ? error.status
            : "statusCode" in error
              ? error.statusCode
              : 500) as number)
        : 500;

    problemDetails.status = status;
    problemDetails.detail = error instanceof Error ? error.message : String(error);

    if (config.app.enableDebugMode && error instanceof Error) {
      problemDetails.stack = error.stack;
      problemDetails.details = error;
    }
  }

  return problemDetails;
}

// Main error handling middleware
export function productionErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(error);
  }

  // Classify and log the error
  const errorDetails = classifyError(error, req);
  logError(error, errorDetails);

  // Generate appropriate response
  const errorResponse = generateErrorResponse(error, errorDetails);

  // Set response headers with request ID for debugging
  const requestId = correlationContext.getStore() || errorDetails.id;
  res.setHeader("X-Error-ID", errorDetails.id);
  res.setHeader("X-Error-Type", errorDetails.type);
  res.setHeader("X-Request-ID", requestId);

  // Send error response
  res.status(Number(errorResponse.status)).json(errorResponse);
}

// 404 Handler
export function notFoundHandler(req: Request, res: Response) {
  const errorDetails = {
    id: generateErrorId(),
    type: "not_found" as const,
    severity: "low" as const,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  // Record 404 in error aggregator
  errorAggregator.recordError({
    id: errorDetails.id,
    type: errorDetails.type,
    severity: errorDetails.severity,
    message: `Resource not found: ${req.method} ${req.path}`,
    timestamp: errorDetails.timestamp,
    path: errorDetails.path,
    method: errorDetails.method,
    ip: errorDetails.ip,
    userAgent: errorDetails.userAgent,
  });

  // Prevent sending headers if already sent (Fix for ERR_HTTP_HEADERS_SENT)
  if (res.headersSent || (req as any)._handled || res.locals._handled) {
    return;
  }

  res.status(404).json({
    type: "urn:problem:not-found",
    title: "Resource Not Found",
    status: 404,
    detail:
      config.app.environment === "production" ? "Resource not found" : `Path ${req.path} not found`,
    instance: req.path,
    requestId: errorDetails.id,
    timestamp: errorDetails.timestamp,
  });
}

// Unhandled promise rejection handler
export function setupGlobalErrorHandlers() {
  const shouldForceExit =
    config.app.environment === "production" || process.env.FORCE_EXIT_ON_CRASH === "true";

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("[CRITICAL] Unhandled Promise Rejection:", reason);
    logger.error("[CRITICAL] Promise:", promise);

    if (shouldForceExit) {
      logger.error("[CRITICAL] Exiting process due to unhandled rejection");
      // Allow a brief window for logs to flush
      setTimeout(() => process.exit(1), 100).unref();
    }
  });

  process.on("uncaughtException", (error) => {
    logger.error("[CRITICAL] Uncaught Exception:", error);

    if (shouldForceExit) {
      logger.error("[CRITICAL] Exiting process due to uncaught exception");
      process.exit(1);
    }
  });
}

// Extended error interface for rate limiting
interface RateLimitError extends Error {
  status: number;
  type: string;
}

// Rate limiting error helper
export function createRateLimitError(): RateLimitError {
  const error = new Error("Too many requests from this IP") as RateLimitError;
  error.status = 429;
  error.type = "rate_limit";
  return error;
}
