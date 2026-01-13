/**
 * Database Module Index
 * Re-exports all database functionality from focused modules
 */

// Connection and core database instance
export { 
  db, 
  sql, 
  checkDatabaseConnection, 
  wakeupDatabase, 
  closeDatabaseConnection,
  type Database 
} from "./connection.js";

// Metrics
export { getPoolMetrics, updateHealthCheckTime } from "./metrics.js";

// Safe wrappers
export { safeQuery } from "./safe-query.js";
export { safeTransaction, type DbClient } from "./transactions.js";
