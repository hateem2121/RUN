import crypto from "node:crypto";
import cookieParser from "cookie-parser";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import helmet from "helmet";
import { logger } from "../lib/monitoring/logger.js";
import { csrfProtection } from "../middleware/csrf.js";
import {
  productionErrorHandler,
  setupGlobalErrorHandlers,
} from "../middleware/production-error-handler.js";
import { requestSanitization } from "../middleware/sanitization.js";
import { idempotencyMiddleware } from "../middleware/idempotency.js";
import { authService } from "../services/auth-service.js";



/**
 * Global Middleware Configuration
 */
export async function setupMiddleware(app: Express) {
  // 1. Core Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'", "*.google.com", "*.gstatic.com"],
          "frame-src": ["'self'", "*.google.com"],
          "connect-src": ["'self'", "*.google.com", "*.gstatic.com", "vitals.vercel-insights.com"],
          "img-src": ["'self'", "data:", "*.google.com", "*.gstatic.com", "https://*"],
          "font-src": [
            "'self'",
            "https:",
            "data:",
            "http://localhost:5002",
            "http://127.0.0.1:5002",
          ],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for some 3D/Media elements
    }),
  );

  // 2. Cookie Parser (Required for CSRF and sessions)
  app.use(cookieParser());

  // 3. Initialize Passport + Google OAuth strategy (requires cookie parser first)
  await authService.setup(app);

  // 4. Basic Security & Identity
  app.use(createCorsMiddleware());
  app.use(nonceMiddleware);

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
 * Helper: CSP Nonce Middleware
 */
function nonceMiddleware(_req: Request, res: Response, next: NextFunction) {
  const nonce = crypto.randomBytes(16).toString("base64url");
  res.locals.cspNonce = nonce;
  next();
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
