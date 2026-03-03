import { pgTableCreator } from "drizzle-orm/pg-core";

// Create custom table creator (fixes deprecation warnings in Drizzle ORM 0.44+)
export const pgTable = pgTableCreator((name) => name);
