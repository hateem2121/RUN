import type { NextFunction, Request, Response } from "express";
import { getConfig } from "../config/production.js";
import {
  AppError,
  AuthenticationError,
  ConflictError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../lib/errors.js";
import { alertService } from "../lib/integrations/alert-service.js";
import { errorAggregator } from "../lib/monitoring/error-aggregator.js";
import { correlationContext, logger } from "../lib/monitoring/logger.js";
import { getRunbookUrl, shouldIncludeRunbook } from "../lib/runbook-registry.js";
// Production-Grade Error Handling
// PHASE 4: Production Readiness - Error Management

import type { ProblemDetails } from "@run-remix/shared";

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
    | "external_service"
    | "conflict";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  userAgent?: string | undefined;
  ip?: string | undefined;
  path: string;
  method: string;
}

// Generate unique error ID for tracking
function generateErrorId(): string {
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

  if (error instanceof AppError) {
    if (error instanceof ValidationError) {
      type = "validation";
      severity = "low";
    } else if (error instanceof AuthenticationError) {
      type = "authentication";
      severity = "medium";
    } else if (error instanceof ForbiddenError) {
      type = "authorization";
      severity = "medium";
    } else if (error instanceof NotFoundError) {
      type = "not_found";
      severity = "low";
    } else if (error instanceof ConflictError) {
      type = "conflict";
      severity = "low";
    } else if (error instanceof RateLimitError) {
      type = "rate_limit";
      severity = "low";
    } else if (error instanceof DatabaseError) {
      type = "database";
      severity = "high";
    } else {
      // Fallback for generic AppError logic if extended elsewhere
      type = error.statusCode >= 500 ? "internal" : "validation";
      severity = error.statusCode >= 500 ? "high" : "low";
    }
  }
  // Generic / External Errors
  else {
    const errorCode =
      error && typeof error === "object" && "code" in error ? error.code : undefined;

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

  const correlationId = correlationContext.getStore();
  const meta = {
    errorId: details.id,
    path: details.path,
    method: details.method,
    ip: details.ip,
    type: details.type,
    correlationId,
    ...(error instanceof AppError && error.details ? error.details : {}),
  };

  // Always log critical and high severity errors
  if (details.severity === "critical" || details.severity === "high") {
    logger.error(
      `[ERROR ${details.id}] ${details.type.toUpperCase()}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      meta,
      error instanceof Error ? error : undefined,
    );
  }
  // Log medium severity in development and staging or if warn level
  else if (details.severity === "medium" && (logLevel === "info" || logLevel === "debug")) {
    logger.warn(
      `[WARN ${details.id}] ${details.type}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      meta,
      error instanceof Error ? error : undefined,
    );
  }
  // Log low severity only in debug mode
  else if (details.severity === "low" && logLevel === "debug") {
    logger.info(
      `[INFO ${details.id}] ${details.type}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      meta,
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

  // If using AppError, we can trust the public message for operational errors
  if (error instanceof AppError && error.isOperational) {
    problemDetails.detail = error.message;
    problemDetails.status = error.statusCode;
    // Add standardized error code for frontend clients
    problemDetails.code = error.code;

    // Type-specific overrides (RFC 9457 compliant URIs)
    const ERROR_TYPE_BASE = "https://api.run-remix.com/errors";
    switch (details.type) {
      case "validation":
        problemDetails.type = `${ERROR_TYPE_BASE}/validation-failed`;
        problemDetails.title = "Validation Failed";
        break;
      case "authentication":
        problemDetails.type = `${ERROR_TYPE_BASE}/unauthorized`;
        problemDetails.title = "Authentication Required";
        break;
      case "authorization":
        problemDetails.type = `${ERROR_TYPE_BASE}/forbidden`;
        problemDetails.title = "Access Denied";
        break;
      case "not_found":
        problemDetails.type = `${ERROR_TYPE_BASE}/resource-not-found`;
        problemDetails.title = "Resource Not Found";
        break;
      case "rate_limit":
        problemDetails.type = `${ERROR_TYPE_BASE}/rate-limit-exceeded`;
        problemDetails.title = "Rate Limit Exceeded";
        break;
      case "conflict":
        problemDetails.type = `${ERROR_TYPE_BASE}/conflict`;
        problemDetails.title = "Resource Conflict";
        break;
      case "database":
        // For database errors, we might want to hide details in prod
        problemDetails.type = `${ERROR_TYPE_BASE}/service-unavailable`;
        problemDetails.title = "Service Unavailable";
        problemDetails.detail = isProd ? "Service temporarily unavailable" : error.message;
        break;
    }

    if (error.details) {
      if (details.type === "validation") {
        problemDetails["invalid-params"] = error.details;
      } else {
        problemDetails.details = error.details;
      }
    }

    return problemDetails;
  }

  // Fallback for non-AppErrors (Legacy Mode)
  // RFC 9457 compliant error type URIs
  const ERROR_TYPE_BASE = "https://api.run-remix.com/errors";

  if (isProd) {
    switch (details.type) {
      case "validation":
        problemDetails.type = `${ERROR_TYPE_BASE}/validation-failed`;
        problemDetails.title = "Validation Failed";
        problemDetails.status = 400;
        problemDetails.detail = "The request parameters failed validation";
        if ("issues" in (error as any)) {
          problemDetails["invalid-params"] = (error as any).issues;
        }
        break;
      case "authentication":
        problemDetails.type = `${ERROR_TYPE_BASE}/unauthorized`;
        problemDetails.title = "Authentication Required";
        problemDetails.status = 401;
        problemDetails.detail = "You must be logged in to access this resource";
        break;
      case "authorization":
        problemDetails.type = `${ERROR_TYPE_BASE}/forbidden`;
        problemDetails.title = "Access Denied";
        problemDetails.status = 403;
        problemDetails.detail = "You do not have permission to access this resource";
        break;
      case "not_found":
        problemDetails.type = `${ERROR_TYPE_BASE}/resource-not-found`;
        problemDetails.title = "Resource Not Found";
        problemDetails.status = 404;
        problemDetails.detail = "The requested resource could not be found";
        break;
      case "rate_limit":
        problemDetails.type = `${ERROR_TYPE_BASE}/rate-limit-exceeded`;
        problemDetails.title = "Rate Limit Exceeded";
        problemDetails.status = 429;
        problemDetails.detail = "Too many requests, please try again later";
        break;
      default:
        // Keep generic 500
        problemDetails.type = `${ERROR_TYPE_BASE}/internal-error`;
        break;
    }
  } else {
    // Development/Staging - Detailed
    problemDetails.type = `${ERROR_TYPE_BASE}/${details.type}`;
    problemDetails.title = error instanceof Error ? error.name : "Error";

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

  // Handle Rate Limit Retry-After
  if (errorDetails.type === "rate_limit" && error instanceof AppError) {
    // Check details for retryAfter value
    if (error.details?.retryAfter) {
      res.setHeader("Retry-After", String(error.details.retryAfter));
    }
  }

  // Free tier alerting for 5xx errors in production (Discord/Slack webhooks)
  const statusCode = Number(errorResponse.status);
  if (statusCode >= 500 && config.app.environment === "production") {
    // Get runbook URL for the error code
    const errorCode = error instanceof AppError ? error.code : "INTERNAL_ERROR";
    const runbookUrl = getRunbookUrl(errorCode);

    // Fire-and-forget alert via Discord/Slack
    const alertError = error instanceof Error ? error : new Error(String(error));
    alertService
      .alertOnServerError(alertError, req.path, statusCode, runbookUrl)
      .catch((alertErr: Error) => {
        logger.warn("[ErrorHandler] Failed to send alert", alertErr);
      });
  }

  // Add runbook link for high-severity operational errors (non-production only for security)
  if (shouldIncludeRunbook(errorDetails.severity)) {
    const errorCode = error instanceof AppError ? error.code : "INTERNAL_ERROR";
    const runbookUrl = getRunbookUrl(errorCode);
    if (runbookUrl) {
      // In production, only include in internal logging, not response
      if (config.app.environment !== "production") {
        (errorResponse as any).runbook = runbookUrl;
      }
      // Always log the runbook URL for operators
      logger.info("[ErrorHandler] Runbook available", { errorCode, runbookUrl });
    }
  }

  // Send error response with RFC 9457 Content-Type
  res.status(statusCode).setHeader("Content-Type", "application/problem+json").json(errorResponse);
}

// 404 Handler
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  // Instead of handling it here, pass a NotFoundError to the global handler
  // This ensures consistent logging and formatting
  next(new NotFoundError(req.path));
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
