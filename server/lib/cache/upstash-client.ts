import { Redis } from "@upstash/redis";
import { logger } from "../monitoring/logger.js";

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  if (isProduction) {
    logger.error(
      "CRITICAL: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing in PRODUCTION. System will fall back to volatile in-memory storage, which will break rate limiting and global cache consistency across multiple instances.",
    );
  } else {
    logger.warn(
      "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Rate limiting and global caching will fall back to local in-memory storage.",
    );
  }
}

export const redis = new Proxy(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : ({} as unknown as Redis),
  {
    get: (target, prop, receiver) => {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return async (...args: unknown[]) => {
          const { withCircuit, REDIS_CIRCUIT_OPTIONS } = await import(
            "../resilience/circuit-breaker.js"
          );
          return await withCircuit(
            `redis-${String(prop)}`,
            () => value.apply(target, args),
            REDIS_CIRCUIT_OPTIONS,
          );
        };
      }
      return value;
    },
  },
);

export const isRedisEnabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
