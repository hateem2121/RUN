import type { InferSelectModel } from "drizzle-orm";
import type { users } from "../../shared/schema.js";

declare global {
  namespace Express {
    interface User extends InferSelectModel<typeof users> {}
  }
}
