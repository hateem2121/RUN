/**
 * DATABASE KEEP-ALIVE SERVICE
 * Prevents Neon free tier auto-suspend by pinging database every 4 minutes
 * Neon suspends after 5 minutes of inactivity, causing 200-500ms cold start penalty
 */

import { sql as rawSql } from "../../db.js";
import { logger } from "../monitoring/logger.js";

export class DatabaseKeepAlive {
  private static instance: DatabaseKeepAlive;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes (before 5-min auto-suspend)
  private lastPingTime: number = 0;
  private isActive: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseKeepAlive {
    if (!DatabaseKeepAlive.instance) {
      DatabaseKeepAlive.instance = new DatabaseKeepAlive();
    }
    return DatabaseKeepAlive.instance;
  }

  /**
   * Start keep-alive pings to prevent database auto-suspend
   */
  start(): void {
    if (this.isActive) {
      logger.debug("[DB Keep-Alive] Already running");
      return;
    }

    this.isActive = true;
    logger.info("[DB Keep-Alive] ✅ Started (ping every 4 minutes to prevent auto-suspend)");

    // Initial ping
    this.ping().catch((err) => logger.warn("[DB Keep-Alive] Initial ping failed:", err));

    // Schedule periodic pings
    this.intervalId = setInterval(() => {
      this.ping().catch((err) => logger.warn("[DB Keep-Alive] Ping failed:", err));
    }, this.PING_INTERVAL_MS);

    // Cleanup on process shutdown
    process.once("SIGINT", () => this.stop());
    process.once("SIGTERM", () => this.stop());
  }

  /**
   * Stop keep-alive pings
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isActive = false;
      logger.info("[DB Keep-Alive] ⏹️ Stopped");
    }
  }

  /**
   * Execute lightweight ping query to keep database active
   */
  private async ping(): Promise<void> {
    const startTime = performance.now();

    try {
      // Lightweight query: SELECT 1 using raw Neon driver to avoid any Drizzle overhead/state issues
      await rawSql`SELECT 1 as ping`;

      const duration = Math.round(performance.now() - startTime);
      this.lastPingTime = Date.now();

      logger.debug(`[DB Keep-Alive] ✓ Ping successful (${duration}ms)`);
    } catch (error) {
      logger.error("[DB Keep-Alive] ✗ Ping failed:", {
        error: error instanceof Error ? error.message : String(error),
        code: (error as NodeJS.ErrnoException)?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Get keep-alive status
   */
  getStatus(): {
    isActive: boolean;
    lastPingTime: number;
    nextPingIn: number;
  } {
    const nextPingIn =
      this.isActive && this.lastPingTime > 0
        ? Math.max(0, this.PING_INTERVAL_MS - (Date.now() - this.lastPingTime))
        : 0;

    return {
      isActive: this.isActive,
      lastPingTime: this.lastPingTime,
      nextPingIn,
    };
  }
}

// Export singleton instance
export const dbKeepAlive = DatabaseKeepAlive.getInstance();
