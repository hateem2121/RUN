/**
 * Script to promote a user to admin
 * Run with: npx tsx scripts/promote-admin.ts
 */

import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "team@wear-run.com";

async function promoteToAdmin() {
    console.log(`Promoting user with email: ${ADMIN_EMAIL} to admin...`);

    const result = await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.email, ADMIN_EMAIL))
        .returning();

    if (result.length > 0) {
        console.log("✅ User promoted to admin successfully!");
        console.log("User details:", result[0]);
        console.log("\nYou can now access the admin dashboard at http://localhost:5001/admin");
    } else {
        console.log("❌ No user found with that email");
    }
}

promoteToAdmin()
    .then(() => {
        console.log("Done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
