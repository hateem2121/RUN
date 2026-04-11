import { sql } from "drizzle-orm";
import { db } from "../server/db.js";
import { users } from "../shared/schemas/index.js";

async function promoteUsers() {
  console.log("Promoting all users to admin for QA audit...");
  try {
    const result = await db.update(users).set({ isAdmin: true });
    console.log("✅ All users promoted to admin.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Promotion failed:", error);
    process.exit(1);
  }
}

promoteUsers();
