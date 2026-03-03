import type { InferSelectModel } from "drizzle-orm";
import type { users } from "../../shared/index.js";

declare global {
  namespace Express {
    interface User extends InferSelectModel<typeof users> {}
  }
}
