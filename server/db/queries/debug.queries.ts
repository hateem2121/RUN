import { sql } from "drizzle-orm";
import { db } from "../../db.js";

export async function executeSlowQuery(duration: number) {
  const query = sql.raw(`SELECT pg_sleep(${duration})`);
  await db.execute(query);
}
