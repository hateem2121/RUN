import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../../server/db.js";

async function main() {
  console.log("Testing database connection...");
  try {
    const result = await db.execute(sql`SELECT 1 as ping`);
    console.log("Connection successful:", result);
  } catch (error) {
    console.error("Connection failed:", error);
  }
  process.exit(0);
}

main();
