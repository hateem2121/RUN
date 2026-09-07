import type { Server } from "node:http";
import { sseHub } from "../services/realtime/sse-hub.js";
import { logger } from "./monitoring/logger.js";

type ShutdownHook = () => Promise<void> | void;

const hooks: ShutdownHook[] = [];
let isShuttingDown = false;
let httpServer: Server | null = null;

/**
 * Register a shutdown hook to be called during graceful shutdown.
 * Hooks are called in registration order after HTTP server closes.
 *
 * @example
 * registerShutdownHook(async () => {
 *   await pool.end();
 *   logger.info("[DB] Connection pool closed");
 * });
 */
export function registerShutdownHook(hook: ShutdownHook): void {
  hooks.push(hook);
}

/**
 * Perform graceful shutdown:
 * 1. Drain active SSE client connections with randomized backoff jitter
 * 2. Stop accepting new connections
 * 3. Wait for in-flight requests to complete (up to timeout)
 * 4. Run all registered shutdown hooks
 * 5. Exit process
 */
async function performShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`[Shutdown] Already shutting down, ignoring ${signal}`);
    return;
  }
  isShuttingDown = true;

  logger.info(`[Shutdown] ${signal} received, starting graceful shutdown...`);

  // SSE-02: Drain all active SSE connections before closing HTTP server
  try {
    const sseCount = sseHub.getActiveCount();
    if (sseCount > 0) {
      logger.info(`[Shutdown] Draining ${sseCount} active SSE client(s) with randomized jitter...`);
    }
    await sseHub.drainAll();
    if (sseCount > 0) {
      logger.info("[Shutdown] All SSE clients drained successfully");
    }
  } catch (error) {
    logger.error("[Shutdown] Error draining SSE clients:", error);
  }

  // Close HTTP server to stop accepting new connections
  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer!.close(() => {
        logger.info("[Shutdown] HTTP server closed, no longer accepting connections");
        resolve();
      });
    });
  }

  // Run all registered hooks
  logger.info(`[Shutdown] Running ${hooks.length} shutdown hooks...`);
  for (const hook of hooks) {
    try {
      await hook();
    } catch (error) {
      logger.error("[Shutdown] Hook failed:", error);
    }
  }

  logger.info("[Shutdown] Graceful shutdown complete");
  process.exit(0);
}

/**
 * Setup graceful shutdown handlers for the HTTP server.
 * Call this once during server startup.
 *
 * @param server - The HTTP server instance
 * @param forceExitTimeoutMs - Force exit after this timeout (default: 30s)
 */
export function setupGracefulShutdown(server: Server, forceExitTimeoutMs = 30000): void {
  httpServer = server;

  const handleSignal = (signal: string) => {
    // Set a hard timeout for force exit
    const timeout = setTimeout(() => {
      logger.error(`[Shutdown] Force exit after ${forceExitTimeoutMs}ms timeout`);
      process.exit(1);
    }, forceExitTimeoutMs);
    timeout.unref(); // Don't keep process alive just for this timer

    performShutdown(signal).catch((error) => {
      logger.error("[Shutdown] Fatal error during shutdown:", error);
      process.exit(1);
    });
  };

  process.on("SIGTERM", () => handleSignal("SIGTERM"));
  process.on("SIGINT", () => handleSignal("SIGINT"));
}

/**
 * Check if the server is currently shutting down.
 * Useful for health checks or request handlers.
 */
/** @public */ export function isServerShuttingDown(): boolean {
  return isShuttingDown;
}
