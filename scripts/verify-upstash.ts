import { isRedisEnabled, redis } from "../server/lib/cache/upstash-client.js";

async function verifyUpstash() {
  console.log("🔍 Checking Upstash Redis connectivity...");

  if (!isRedisEnabled) {
    console.error("❌ Upstash Redis is not enabled (missing configuration).");
    process.exit(1);
  }

  try {
    const result = await redis.ping();
    if (result === "PONG") {
      console.log("✅ Upstash Redis connection successful (PONG).");
      process.exit(0);
    } else {
      console.error(`❌ Upstash Redis returned unexpected response: ${result}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Upstash Redis connection failed:", error);
    process.exit(1);
  }
}

verifyUpstash();
