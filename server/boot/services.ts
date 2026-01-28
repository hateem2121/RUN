import { getConfig } from "../config/production.js";
import { wakeupDatabase } from "../db.js";
import { dbKeepAlive } from "../lib/db/keep-alive.js";
import { adminNotifier } from "../lib/integrations/admin-notifier.js";
import { getLifecycleScheduler } from "../lib/integrations/storage-lifecycle-scheduler.js";
import { logger } from "../lib/monitoring/logger.js";
import { getStorage } from "../lib/storage-singleton.js";

const config = getConfig();

// Simplified Service Stubs
const backupScheduler = {
  start: async () => logger.info("[Backup] Using PostgreSQL automatic backups"),
  stop: async () => logger.info("[Backup] Backup scheduler stopped"),
};

const workflowAutomation = {
  start: async () => logger.info("[Workflow] Workflow automation active"),
};

const DatabasePerformanceOptimizer = {
  optimize: async () => logger.info("[DB] PostgreSQL optimization active"),
};

export async function startServices() {
  logger.info("[Startup] Starting background services...");

  // 1. Database Health & Optimization
  if (config.app.environment === "production") {
    backupScheduler.start();
  }

  // 2. Workflow Automation
  workflowAutomation.start();

  // 3. Storage Lifecycle
  try {
    const lifecycleScheduler = getLifecycleScheduler({
      enabled: false,
      interval: 60 * 60 * 1000,
      dryRun: false,
    });
    // lifecycleScheduler.start();
  } catch (e) {
    logger.warn("Failed to start storage lifecycle scheduler", e);
  }

  // 4. Admin Notifier
  try {
    adminNotifier.start();
  } catch (e) {
    logger.error("Failed to start admin notifier", e);
  }

  // 5. DB Keep Alive (Critical for Neon)
  dbKeepAlive.start();

  // 6. Database Optimizer
  await DatabasePerformanceOptimizer.optimize();

  // 7. Cold Start Resilience
  await handleColdStart();

  // 8. Database Health Check
  await performInitialHealthCheck();

  logger.info("[Startup] All services started.");
}

async function handleColdStart() {
  // Wake up DB
  const wakeup = await wakeupDatabase();
  if (!wakeup.success) {
    logger.warn("[Startup] Database wakeup fallback triggered");
  }

  // Warm Cache (Non-blocking)
  // retryDbOperation(() => unifiedCache.warmCache(), {
  //   maxRetries: 3,
  //   backoffMs: 500,
  //   operationName: "Cache warming",
  // }).catch(err => logger.warn("Cache warming failed", err));
}

async function performInitialHealthCheck() {
  try {
    const health = await getStorage().checkDatabaseHealth();
    if (health.healthy) {
      logger.info("[Startup] Database health check passed");
    } else {
      logger.warn("[Startup] Database health check returned unhealthy status");
    }
  } catch (e) {
    logger.error("[Startup] Initial database health check failed", e);
  }
}
