
import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

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
