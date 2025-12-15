import { logger } from "../lib/smart-logger.js";
// Production Security Middleware
// PHASE 4: Production Readiness - Security Hardening

import { Request, Response, NextFunction } from "express";
import { getConfig } from "../config/production.js";
import { security } from "../config/environment.js";

const config = getConfig();

// Security Headers Middleware
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (config.security.headers.enableSecurity) {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // XSS Protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content Security Policy - Enhanced for @google/model-viewer embedded texture support
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://modelviewer.dev https://cdn.jsdelivr.net https://replit.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: blob: https:; " +
        "connect-src 'self' https: data: blob:; " +
        "worker-src 'self' blob:; " +
        "media-src 'self' https:;",
    );

    // HTTP Strict Transport Security (HSTS)
    if (config.security.headers.hsts && req.secure) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }

    // Feature Policy / Permissions Policy
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
    );
  }

  next();
}

// Request Validation Middleware
export function requestValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Validate request size
  const contentLength = parseInt(req.get("Content-Length") || "0");
  const maxSize =
    parseInt(config.app.maxRequestSize.replace("mb", "")) * 1024 * 1024;

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: "Request too large",
      maxSize: config.app.maxRequestSize,
    });
  }

  // Validate Content-Type for POST/PUT/PATCH requests
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.get("Content-Type");

    // CRITICAL FIX: Allow application/octet-stream for chunk uploads
    const isChunkUpload = req.path === "/api/media/upload/chunk-raw";

    // DEBUG: Log path checking for chunk uploads
    if (req.path.includes("chunk") || req.path.includes("upload")) {
      logger.info(
        `[Security Middleware] Path check: "${req.path}" === "/api/media/upload/chunk-raw" ? ${isChunkUpload}`,
      );
    }

    const allowedTypes = [
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
    ];

    // Add application/octet-stream for chunk uploads only
    if (isChunkUpload) {
      allowedTypes.push("application/octet-stream");
    }

    if (
      contentType &&
      !allowedTypes.some((type) => contentType.startsWith(type))
    ) {
      return res.status(415).json({
        error: "Unsupported Media Type",
        allowedTypes,
      });
    }
  }

  return next();
}

// API Key Validation (for future use)
export function apiKeyValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Skip API key validation in development
  if (config.app.environment === "development") {
    return next();
  }

  // For production, check API key for sensitive endpoints
  const sensitiveEndpoints = [
    "/api/admin",
    "/api/enterprise",
    "/api/migration",
    "/api/backup",
  ];

  const isSensitive = sensitiveEndpoints.some((endpoint) =>
    req.path.startsWith(endpoint),
  );

  if (isSensitive) {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({
        error: "API key required for this endpoint",
      });
    }

    // COMPLETED: Proper API key validation using environment variables
    // Validate against configured API keys from environment
    const validApiKeys = [
      security.adminApiKey,
      security.enterpriseApiKey,
      security.migrationApiKey,
    ].filter(Boolean); // Remove undefined/null values

    if (validApiKeys.length === 0) {
      // In production without API keys configured, deny access
      return res.status(503).json({
        error: "API key validation not configured",
      });
    }

    if (typeof apiKey !== "string" || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }
  }

  return next();
}

// Request Timeout Middleware
export function requestTimeout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Skip timeout for media upload and streaming routes
  const mediaRoutes = [
    "/api/media",
    "/api/media/upload",
    "/api/media/upload-chunked",
    "/api/media/proxy",
    "/api/media/stream",
    "/api/media/progressive",
    "/api/media/batch",
  ];

  const isMediaRoute = mediaRoutes.some((route) => req.path.startsWith(route));

  if (isMediaRoute) {
    // No timeout for media operations - allow unlimited upload time
    return next();
  }

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: "Request timeout",
        timeout: config.app.requestTimeout + "ms",
      });
    }
  }, config.app.requestTimeout);

  // Clear timeout when response is sent
  res.on("finish", () => {
    clearTimeout(timeout);
  });

  next();
}

// Production-specific request logging
export function productionLogging(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (config.app.environment === "production") {
    // Log only essential information in production
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? "ERROR" : "INFO";

      logger.info(
        `[${logLevel}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`,
      );

      // Log slow requests
      if (duration > config.monitoring.alertThresholds.responseTime) {
        logger.warn(
          `[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms`,
        );
      }
    });
  }

  next();
}
