import { Client } from "pg";
import { database as dbConfig } from "../../config/environment.js";
import { adminCacheManager } from "../cache/admin-cache.js";
import { logger } from "../monitoring/logger.js";
import { registerShutdownHook } from "../shutdown-manager.js";

const CHANNEL = "admin_cache_clear";
let listenerClient: Client | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export const adminNotifier = {
  /**
   * Start listening for cache invalidation events
   * Uses a dedicated PG connection because LISTEN/NOTIFY requires it.
   */
  async start() {
    const connectionString = dbConfig.directUrl || dbConfig.url;

    if (!connectionString) {
      logger.warn("[AdminNotifier] No database URL configured, skipping listener startup.");
      return;
    }

    // Register shutdown hook once
    registerShutdownHook(async () => {
      await adminNotifier.stop();
    });

    const connect = async () => {
      try {
        listenerClient = new Client({
          connectionString,
          keepAlive: true,
          ssl: dbConfig.ssl, // Use centralized SSL config
        });

        await listenerClient.connect();

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
          logger.error("[AdminNotifier] Listener connection error:", err);
          scheduleReconnect();
        });

        listenerClient.on("end", () => {
          logger.warn("[AdminNotifier] Listener connection ended");
          scheduleReconnect();
        });

        await listenerClient.query(`LISTEN ${CHANNEL}`);
        logger.info("[AdminNotifier] ✅ Listening for real-time cache invalidation");
      } catch (err) {
        logger.error("[AdminNotifier] Startup failed:", err);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) {
        return;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (process.env.NODE_ENV !== "production") {
          logger.warn("[AdminNotifier] Reconnect disabled in development to prevent log spam");
          return;
        }
        logger.info("[AdminNotifier] Reconnecting...");
        connect();
      }, 5000); // Retry every 5s
    };

    connect();
  },

  /**
   * Stop listening and close connection
   */
  async stop() {
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
    const query = `NOTIFY ${CHANNEL}, '${payload}'`;

    try {
      // If listener is active, use it. Otherwise create one-off.
      if (listenerClient) {
        await listenerClient.query(query);
      } else {
        const tempClient = new Client({
          connectionString,
          ssl: dbConfig.ssl,
        });
        await tempClient.connect();
        await tempClient.query(query);
        await tempClient.end();
      }
      logger.info(`[AdminNotifier] Broadcasted invalidation for ${payload}`);
    } catch (err) {
      logger.error("[AdminNotifier] Failed to broadcast notification:", err);
    }
  },
};
