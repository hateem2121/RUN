/**
 * Script to promote a user to admin
 * Run with: npx tsx scripts/promote-admin.ts
 */

import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { users } from "../shared/schema.js";

const ADMIN_EMAIL = "team@wear-run.com";

async function promoteToAdmin() {
  const result = await db
    .update(users)
    .set({ isAdmin: true })
    .where(eq(users.email, ADMIN_EMAIL))
    .returning();

  if (result.length > 0) {
  } else {
  }
}

promoteToAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
