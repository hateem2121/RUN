import { neonConfig, Pool } from "@neondatabase/serverless";
import * as schema from "@run-remix/shared";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Enable WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// Optimization: Direct SSL negotiation for lower latency
const connectionString = process.env.DATABASE_URL;
const isPooler = connectionString.includes("-pooler");
const hasSslParam = connectionString.includes("sslnegotiation=");

const finalConnectionString =
  isPooler && !hasSslParam
    ? `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslnegotiation=direct`
    : connectionString;

// Use Pool for persistent connections and transactions
const pool = new Pool({
  connectionString: finalConnectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});

// Basic Safe Transaction Wrapper for Client Loaders
export async function safeTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}
