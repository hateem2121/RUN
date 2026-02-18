import "dotenv/config";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "../db.js";

async function runMigrations() {
  try {
    // Assuming this is run from the server directory or with correct CWD
    // If run from server directory: "migrations"
    await migrate(db, { migrationsFolder: "migrations" });
    process.exit(0);
  } catch (_err) {
    process.exit(1);
  }
}

runMigrations();
