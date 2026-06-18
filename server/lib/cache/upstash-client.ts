import { Redis } from "ioredis";
import { logger } from "../monitoring/logger.js";

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.REDIS_URL) {
  if (isProduction) {
    logger.error(
      "CRITICAL: REDIS_URL is missing in PRODUCTION. System will fall back to volatile in-memory storage, which will break rate limiting and global cache consistency across multiple instances.",
    );
  } else {
    logger.warn(
      "REDIS_URL is missing. Rate limiting and global caching will fall back to local in-memory storage.",
    );
  }
}

export const redis = new Proxy(
  process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : ({} as unknown as Redis),
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
  process.env.REDIS_URL &&
    !process.env.REDIS_URL.includes("dummy") &&
    !process.env.VITEST &&
    process.env.NODE_ENV !== "test",
);
