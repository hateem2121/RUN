import path from "node:path";
import { fileURLToPath } from "node:url";
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
import { requestSanitization } from "../middleware/sanitization.js";
import { authService } from "../services/auth-service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  // 8. Audit Logging for Admin Mutations
  app.use("/api/admin", (req, _res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const user = (req as any).user;
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
      // res.setHeader('Access-Control-Allow-Origin', 'https://wear-run.com');
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
  import("node:crypto").then((crypto) => {
    const nonce = crypto.randomBytes(16).toString("hex");
    res.locals.cspNonce = nonce;
    next();
  });
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
  app.use("/api", express.json({ limit: "10mb" }));
  app.use("/api", express.urlencoded({ extended: false, limit: "10mb" }));
}

/**
 * Global Error Handling Middleware
 */
export function setupErrorHandling(app: Express) {
  // Catch-all Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error("[Error] Request failure", {
      status,
      message,
      path: _req.path,
      method: _req.method,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    if (res.headersSent) {
      return _next(err);
    }

    res.status(status).json({
      error: err.code || "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : message,
    });
  });
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
