import { Store } from "express-session";
import { Redis } from "@upstash/redis";
import { logger } from "../monitoring/logger.js";

/**
 * CUSTOM UPSTASH REDIS SESSION STORE
 * Implements the express-session Store interface using the Upstash Redis client.
 * This avoids additional dependencies like 'connect-redis' and leverages the existing OTel-instrumented client.
 */
export class UpstashRedisStore extends Store {
  private client: Redis;
  private prefix: string;
  private ttl: number;

  constructor(options: { client: Redis; prefix?: string; ttl?: number }) {
    super();
    this.client = options.client;
    this.prefix = options.prefix || "sess:";
    this.ttl = options.ttl || 86400; // Default 1 day
  }

  public async get(
    sid: string,
    callback: (err: any, session?: any) => void,
  ): Promise<void> {
    try {
      const data = await this.client.get<any>(this.prefix + sid);
      if (!data) return callback(null, null);
      callback(null, data);
    } catch (err) {
      logger.error("[RedisStore] GET error:", err);
      callback(err);
    }
  }

  public async set(
    sid: string,
    session: any,
    callback?: (err?: any) => void,
  ): Promise<void> {
    try {
      // Use the maxAge from session cookie if available, or default TTL
      const ttl = session.cookie?.maxAge
        ? Math.floor(session.cookie.maxAge / 1000)
        : this.ttl;
      await this.client.set(this.prefix + sid, session, { ex: ttl });
      if (callback) callback();
    } catch (err) {
      logger.error("[RedisStore] SET error:", err);
      if (callback) callback(err);
    }
  }

  public async destroy(
    sid: string,
    callback?: (err?: any) => void,
  ): Promise<void> {
    try {
      await this.client.del(this.prefix + sid);
      if (callback) callback();
    } catch (err) {
      logger.error("[RedisStore] DESTROY error:", err);
      if (callback) callback(err);
    }
  }

  public async touch(
    sid: string,
    session: any,
    callback?: (err?: any) => void,
  ): Promise<void> {
    try {
      const ttl = session.cookie?.maxAge
        ? Math.floor(session.cookie.maxAge / 1000)
        : this.ttl;
      await this.client.expire(this.prefix + sid, ttl);
      if (callback) callback();
    } catch (err) {
      logger.error("[RedisStore] TOUCH error:", err);
      if (callback) callback(err);
    }
  }
}
