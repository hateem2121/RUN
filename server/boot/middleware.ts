import crypto from "node:crypto";
import cookieParser from "cookie-parser";
import express, { type Express, type Request, type RequestHandler } from "express";
import helmet from "helmet";
import { env } from "../lib/env.js";
import { httpMetricsTracker } from "../lib/monitoring/http-metrics.js";
import { logger } from "../lib/monitoring/logger.js";
import { correlationIdMiddleware } from "../middleware/correlation-id.js";
import { csrfProtection } from "../middleware/csrf.js";
import { idempotencyMiddleware } from "../middleware/idempotency.js";
import {
  productionErrorHandler,
  setupGlobalErrorHandlers,
} from "../middleware/production-error-handler.js";
import { requestSanitization } from "../middleware/sanitization.js";
import { authService } from "../services/auth-service.js";

/**
 * Global Middleware Configuration
 */
export async function setupMiddleware(app: Express) {
  // 0. Correlation ID & HTTP metrics tracker (Must be first to track entire request lifecycle)
  app.use(correlationIdMiddleware);
  app.use(httpMetricsTracker.middleware());

  // 1. Core Security Headers (Helmet) with dynamic CSP Nonce
  app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString("base64url");
    res.locals.cspNonce = nonce;

    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": [
            "'self'",
            `'nonce-${nonce}'`,
            "'wasm-unsafe-eval'",
            "'unsafe-eval'",
            "*.google.com",
            "*.gstatic.com",
          ],
          "frame-src": ["'self'", "*.google.com"],
          "connect-src": ["'self'", "*.google.com", "*.gstatic.com", "vitals.vercel-insights.com"],
          "img-src": ["'self'", "data:", "*.google.com", "*.gstatic.com", "https://*"],
          "worker-src": ["'self'", "blob:"],
          "font-src": [
            "'self'",
            "https:",
            "data:",
            `http://localhost:${env.PORT}`,
            `http://127.0.0.1:${env.PORT}`,
          ],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for some 3D/Media elements
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading media from GCS storage buckets
    })(req, res, next);
  });

  // 2. Cookie Parser (Required for CSRF and sessions)
  app.use(cookieParser());

  // 3. Initialize Passport + Google OAuth strategy (requires cookie parser first)
  await authService.setup(app);

  // 4. Basic Security & Identity
  app.use(createCorsMiddleware());

  // 5. CSRF Protection (Double-Submit Cookie pattern)
  app.use(csrfProtection);

  // 6. Request Body Parsers - RESTRICTED TO /api
  configureBodyParsers(app);

  // 7. Sanitization (Must be after body parsers)
  app.use(requestSanitization);

  // 8. Idempotency (Must be after body parsers to catch response JSON)
  app.use(idempotencyMiddleware);

  // 9. Audit Logging for Admin Mutations
  app.use("/api/admin", (req, _res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const user = (req as Request & { user?: { id: string; email: string } }).user;
      logger.info("[Audit] Admin mutation", {
        method: req.method,
        path: req.path,
        userId: user?.id || "anonymous",
        email: user?.email || "anonymous",
        ip: req.ip,
      });
    }
    next();
  });

  logger.info("[Middleware] ✅ Global pipeline configured");
}

/**
 * Helper: CORS Configuration
 */
function createCorsMiddleware(): RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (process.env.NODE_ENV === "production") {
      const allowedOrigins = (process.env.STRICT_ALLOWED_ORIGINS || "https://wear-run.com").split(
        ",",
      );
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
    } else {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-csrf-token");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  };
}

/**
 * Helper: Body-Parsers
 */
function configureBodyParsers(app: Express) {
  app.use(
    "/api/media/upload/chunk-raw",
    express.raw({
      type: "application/octet-stream",
      limit: "1gb",
    }),
  );

  // Standard parsers ONLY for /api routes to avoid consuming the stream for React Router
  app.use("/api", express.json({ limit: "100kb" }));
  app.use("/api", express.urlencoded({ extended: false, limit: "100kb" }));

  if (!process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === "production") {
    logger.warn(
      "[Middleware] ⚠️ UPSTASH_REDIS_REST_URL is missing in production. Rate limiting will degrade to in-memory.",
    );
  }
}

/**
 * Global Error Handling Middleware
 */
export function setupErrorHandling(app: Express) {
  // Primary error handler: ZodError → 400, AppError → structured response
  // Express 5 natively propagates async errors to this handler.
  app.use(productionErrorHandler);

  // Setup global process error handlers (uncaughtException, unhandledRejection)
  setupGlobalErrorHandlers();
}

/**
 * Health Check Endpoints
 */
export function setupHealthChecks(app: Express) {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}
