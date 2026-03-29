import { logger } from "../lib/monitoring/logger.js";
// Note: We might need to export the httpServer from index.ts or have a way to close it.
// For now, we will assume strict exit is better than zombie state.

export const setupProcessHandlers = () => {
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error(
      "Unhandled Rejection detected",
      { reason: String(reason) },
      new Error(String(reason)),
    );
    // CRITICAL: Exit process to avoid zombie state in production
    // Cloud Run / Orchestrator will restart the container
    // CRITICAL: Exit process to avoid zombie state in production
    // Cloud Run / Orchestrator will restart the container
    if (process.env.NODE_ENV === "production" || process.env.FORCE_EXIT_ON_CRASH === "true") {
      logger.error("🛑 Critical: Exiting process due to unhandled rejection");
      // Allow a brief window for logs to flush
      setTimeout(() => process.exit(1), 1000).unref();
    }
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception detected", {}, error);
    logger.error("🛑 Critical: Exiting process due to uncaught exception");

    // Strict exit for uncaught exceptions
    // Use synchronous logging if possible, or wait briefly
    // Strict exit for uncaught exceptions
    // Use synchronous logging if possible, or wait briefly
    if (process.env.NODE_ENV === "production" || process.env.FORCE_EXIT_ON_CRASH === "true") {
      process.exit(1);
    }
  });

  // Graceful shutdown signals
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    // In a real implementation we would close the server here.
    // Since we don't have direct access to 'server' instance easily without circular imports or a global,
    // we settle for logging and exiting.

    // Attempt to exit gracefully
    setTimeout(() => {
      logger.error("Force exiting after timeout");
      process.exit(1);
    }, 10000).unref();

    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};
