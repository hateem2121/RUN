import type { Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequestHandler } from "@react-router/express";
import type { Express, RequestHandler } from "express";
import type { ServerBuild } from "react-router";
import { logger } from "../monitoring/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/lib/ssr -> ../../.. -> server root -> .. -> monorepo root
// But wait, the previous code was `path.resolve(__dirname, "../..")`.
// If __dirname is `/.../server/lib/ssr`, then `../..` is `/.../server`.
// `client/vite.config.ts` is `../client/vite.config.ts` RELATIVE TO SERVER ROOT.
// So if `root` is `server`, then `path.resolve(root, "client/vite.config.ts")` looks for `server/client/vite.config.ts`.
// Correct: `root` should be monorepo root. `server` is at `monorepo/server`. `../..` from `server/lib/ssr` is `server`. `../../..` is monorepo root.
const root = path.resolve(__dirname, "../../..");

/**
 * Creates a Request Handler for React Router 7
 * Handles both Development (Vite Middleware) and Production (Built Server)
 */
export async function createSsrHandler(app: Express, server?: Server): Promise<RequestHandler> {
  const isProduction = process.env.NODE_ENV === "production";
  // Check for test mode - VITEST variable exists when running tests (not just "true")
  const isTest =
    process.env.NODE_ENV === "test" ||
    process.env.VITEST !== undefined ||
    process.env.VITEST_WORKER_ID !== undefined;

  // In test mode, return a no-op handler - integration tests don't need SSR
  if (isTest) {
    logger.info("[SSR] Test mode detected - returning no-op handler");
    return (_req, _res, next) => next();
  }

  if (!isProduction && process.env.SKIP_VITE_DEV_SERVER !== "true") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: "127.0.0.1", // CRITICAL: Force IPv4 to match Express binding and avoid localhost resolution issues
        origin: "http://127.0.0.1:5002", // CRITICAL: Tell Vite what URL to use for internal requests
        hmr: { ...(server ? { server } : {}) },
      },
      optimizeDeps: {
        force: true, // Force re-bundling on every startup to avoid stale cache issues
      },
      appType: "custom",
      configFile: path.resolve(root, "client/vite.config.ts"),
    });

    // Use Vite's Connect instance as middleware
    app.use(vite.middlewares);

    logger.info("[SSR] Initialized Vite Dev Server with React Router");

    return createRequestHandler({
      build: () =>
        vite.ssrLoadModule("virtual:react-router/server-build") as unknown as Promise<ServerBuild>,
      getLoadContext: (_req, res) => ({
        cspNonce: res.locals.cspNonce,
      }),
    });
  } else {
    // Production: Load the built server module
    // Standard React Router 7 build output path
    const buildPath = path.resolve(root, "client/build/server/index.js");

    logger.info(`[SSR] Loading Production Build from: ${buildPath}`);

    return createRequestHandler({
      build: () => import(buildPath),
      getLoadContext: (_req, res) => ({
        cspNonce: res.locals.cspNonce,
      }),
    });
  }
}
