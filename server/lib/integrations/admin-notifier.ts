import { Client } from "pg";
import { database as dbConfig } from "../../config/environment.js";
import { adminCacheManager } from "../cache/admin-cache.js";
import { logger } from "../monitoring/logger.js";
import { registerShutdownHook } from "../shutdown-manager.js";

const CHANNEL = "admin_cache_clear";
let listenerClient: Client | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let connectionState: "stopped" | "connecting" | "connected" | "reconnecting" = "stopped";
let started = false;

export const adminNotifier = {
  /**
   * Start listening for cache invalidation events
   * Uses a dedicated PG connection because LISTEN/NOTIFY requires it.
   */
  async start() {
    if (started) {
      logger.warn("[AdminNotifier] start() called twice — ignoring. Call stop() first to restart.");
      return;
    }
    started = true;
    // CRITICAL: LISTEN/NOTIFY requires a direct connection. Pooled connections (port 6543)
    // in transaction mode will fail or hang.
    const connectionString = dbConfig.directUrl;

    if (!connectionString) {
      if (
        process.env.NODE_ENV === "production" &&
        !process.env.VITEST &&
        !process.env.FORCE_LISTEN
      ) {
        throw new Error(
          "DIRECT_DATABASE_URL is required for admin-notifier (LISTEN/NOTIFY) in production.",
        );
      }
      logger.warn(
        "[AdminNotifier] DIRECT_DATABASE_URL not configured. Real-time cache invalidation disabled.",
      );
      return;
    }

    // Register shutdown hook once
    registerShutdownHook(async () => {
      await adminNotifier.stop();
    });

    let retryCount = 0;

    const connect = async () => {
      connectionState = "connecting";
      try {
        listenerClient = new Client({
          connectionString,
          keepAlive: true,
          ssl: dbConfig.ssl,
        });

        await listenerClient.connect();
        connectionState = "connected";

        listenerClient.on("notification", (msg) => {
          if (msg.channel === CHANNEL) {
            const userId = msg.payload;
            if (userId && userId !== "ALL") {
              logger.info(`[AdminNotifier] Received invalidation for user ${userId}`);
              adminCacheManager.clearUser(userId);
            } else {
              logger.info(`[AdminNotifier] Received GLOBAL invalidation`);
              adminCacheManager.clear();
            }
          }
        });

        listenerClient.on("error", (err) => {
          connectionState = "reconnecting";
          logger.error("[AdminNotifier] Listener connection error:", err);
          scheduleReconnect();
        });

        listenerClient.on("end", () => {
          connectionState = "reconnecting";
          logger.warn("[AdminNotifier] Listener connection ended");
          scheduleReconnect();
        });

        await listenerClient.query(`LISTEN ${CHANNEL}`);
        logger.info("[AdminNotifier] ✅ Listening for real-time cache invalidation");
        retryCount = 0; // Reset on success
      } catch (err) {
        connectionState = "reconnecting";
        logger.error("[AdminNotifier] Startup failed:", err);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) {
        return;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, capped at 30s
      const delay = Math.min(2 ** retryCount * 1000, 30000);
      retryCount++;

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        logger.info(`[AdminNotifier] Reconnecting in ${delay}ms... (Attempt ${retryCount})`);
        connect();
      }, delay);
    };

    connect();
  },

  /**
   * Stop listening and close connection
   */
  async stop() {
    started = false;
    connectionState = "stopped";

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (listenerClient) {
      try {
        logger.info("[AdminNotifier] Stopping listener...");
        await listenerClient.end();
        listenerClient = null;
        logger.info("[AdminNotifier] Listener stopped.");
      } catch (err) {
        logger.error("[AdminNotifier] Error stopping listener:", err);
        listenerClient = null;
      }
    }
  },

  /**
   * broadcast invalidation event
   * @param userId specific user ID or undefined for all
   */
  async notify(userId?: string) {
    const connectionString = dbConfig.directUrl || dbConfig.url;
    if (!connectionString) {
      return;
    }

    const payload = userId || "ALL";

    try {
      // Use parameterized pg_notify to prevent NOTIFY injection via single-quote in payload
      const safeQuery = "SELECT pg_notify($1, $2)";
      const params = [CHANNEL, payload];

      // Only use listenerClient when connection is confirmed stable
      if (listenerClient && connectionState === "connected") {
        await listenerClient.query(safeQuery, params);
      } else {
        const tempClient = new Client({
          connectionString,
          ssl: dbConfig.ssl,
        });
        await tempClient.connect();
        await tempClient.query("SELECT pg_notify($1, $2)", params);
        await tempClient.end();
      }
      logger.info(`[AdminNotifier] Broadcasted invalidation for ${payload}`);
    } catch (err) {
      logger.error("[AdminNotifier] Failed to broadcast notification:", err);
    }
  },
};
