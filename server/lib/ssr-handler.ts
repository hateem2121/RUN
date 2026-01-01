import type { Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequestHandler } from "@react-router/express";
import type { Express, RequestHandler } from "express";
import { logger } from "./monitoring/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

/**
 * Creates a Request Handler for React Router 7
 * Handles both Development (Vite Middleware) and Production (Built Server)
 */
export async function createSsrHandler(app: Express, server?: Server): Promise<RequestHandler> {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: server, // Attach HMR to the existing HTTP server
        },
      },
      appType: "custom",
      configFile: path.resolve(root, "client/vite.config.ts"),
    });

    // Use Vite's Connect instance as middleware
    app.use(vite.middlewares);

    logger.info("[SSR] Initialized Vite Dev Server with React Router");

    return createRequestHandler({
      build: () => vite.ssrLoadModule("virtual:react-router/server-build") as any,
      getLoadContext: (_req, res) => ({
        cspNonce: res.locals.cspNonce,
      }),
    });
  } else {
    // Production: Load the built server module
    // Adjust path based on your vite.config.ts output
    const buildPath = path.resolve(root, "dist/server/index.js");

    logger.info(`[SSR] Loading Production Build from: ${buildPath}`);

    return createRequestHandler({
      build: () => import(buildPath),
      getLoadContext: (_req, res) => ({
        cspNonce: res.locals.cspNonce,
      }),
    });
  }
}
