import { Redis } from "@upstash/redis";
import { logger } from "../monitoring/logger.js";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  logger.warn(
    "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Rate limiting will fall back to in-memory storage.",
  );
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
