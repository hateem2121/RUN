/**
 * Database Module Index
 * Re-exports all database functionality from focused modules
 */

// Connection and core database instance
export {
  checkDatabaseConnection,
  closeDatabaseConnection,
  type Database,
  db,
  sql,
  wakeupDatabase,
} from "./connection.js";

// Metrics
export { getPoolMetrics, updateHealthCheckTime } from "./metrics.js";

// Safe wrappers
export { safeQuery } from "./safe-query.js";
export { type DbClient, safeTransaction } from "./transactions.js";
