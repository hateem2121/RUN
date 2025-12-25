import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../../server/db.js";

async function main() {
  try {
    const _result = await db.execute(sql`SELECT 1 as ping`);
  } catch (_error) {}
  process.exit(0);
}

main();
