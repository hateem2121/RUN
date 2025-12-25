/**
 * Script to fix the duplicate user issue
 * Run with: npx tsx scripts/fix-user-conflict.ts
 */

import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { users } from "../shared/schema.js";

const TARGET_EMAIL = "team@wear-run.com";

async function fixUserConflict() {
  const existingUsers = await db.select().from(users).where(eq(users.email, TARGET_EMAIL));

  if (existingUsers.length > 0) {
    await db.delete(users).where(eq(users.email, TARGET_EMAIL));
  } else {
  }
}

fixUserConflict()
  .then(() => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
