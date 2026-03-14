import { users } from "@run-remix/shared";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";

export async function getAdminUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}
