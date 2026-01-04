import { Client } from "pg";
import { adminCacheManager } from "../cache/admin-cache.js";
import { logger } from "../monitoring/logger.js";

const CHANNEL = "admin_cache_clear";
let listenerClient: Client | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export const adminNotifier = {
  /**
   * Start listening for cache invalidation events
   * Uses a dedicated PG connection because LISTEN/NOTIFY requires it.
   */
  async start() {
    if (!process.env.DATABASE_URL) return;

    const connect = async () => {
      try {
        listenerClient = new Client({
          connectionString: process.env.DATABASE_URL,
          keepAlive: true,
          ssl: true, // Neon requires SSL
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
      if (reconnectTimer) return;
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
   * broadcast invalidation event
   * @param userId specific user ID or undefined for all
   */
  async notify(userId?: string) {
    if (!process.env.DATABASE_URL) return;

    // We can use a separate ephemeral client or the app's pool.
    // Ideally use the app's main db pool, but to avoid circular deps with db.ts,
    // we'll just open a quick connection or assume caller handles it?
    // Actually, creating a client is cheap enough here for admin actions (rare).
    // Or we can assume `listenerClient` is connected and valid to use for query?
    // Yes, we can use listenerClient to sending NOTIFY too if connected.

    const payload = userId || "ALL";
    const query = `NOTIFY ${CHANNEL}, '${payload}'`;

    try {
      // If listener is active, use it. Otherwise create one-off.
      if (listenerClient) {
        await listenerClient.query(query);
      } else {
        const tempClient = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: true,
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
