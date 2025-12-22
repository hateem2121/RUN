/**
 * Script to fix the duplicate user issue
 * Run with: npx tsx scripts/fix-user-conflict.ts
 */

import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { users } from "../shared/schema.js";

const TARGET_EMAIL = "team@wear-run.com";

async function fixUserConflict() {
    console.log(`Checking for user with email: ${TARGET_EMAIL}`);

    const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, TARGET_EMAIL));

    console.log(`Found ${existingUsers.length} user(s) with this email`);

    if (existingUsers.length > 0) {
        console.log("Deleting existing user(s)...");
        await db.delete(users).where(eq(users.email, TARGET_EMAIL));
        console.log("✅ User deleted successfully");
        console.log("You can now try logging in again");
    } else {
        console.log("No conflicting user found");
    }
}

fixUserConflict()
    .then(() => {
        console.log("Done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
