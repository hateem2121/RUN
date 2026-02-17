/**
 * Database Module Index
 * Re-exports all database functionality from the consolidated db.ts
 */

export {
  checkDatabaseConnection,
  closeDatabaseConnection,
  type Database,
  type DbClient,
  db,
  getPoolMetrics,
  safeQuery,
  safeTransaction,
  sql,
  updateHealthCheckTime,
  wakeupDatabase,
} from "../../db.js";
