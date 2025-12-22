import dotenv from "dotenv";
import { cleanEnv, num, port, str, url } from "envalid";

dotenv.config();

// Validate environment variables immediately on import
export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "test", "production", "staging"] }),
  PORT: port({ default: 5000 }),
  DATABASE_URL: url({ desc: "PostgreSQL connection string" }),
  SESSION_SECRET: str({ desc: "Express session secret" }),

  // Optional variables
  CACHE_TTL: num({ default: 300 }), // 5 minutes default
  LOG_LEVEL: str({ choices: ["debug", "info", "warn", "error"], default: "info" }),
});
