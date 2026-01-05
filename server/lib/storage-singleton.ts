import { logger } from "./monitoring/logger.js";

/**
 * DIRECT POSTGRESQL STORAGE SINGLETON
 * Provides single, shared PostgreSQL-only storage instance
 * Eliminates hybrid complexity for maximum reliability
 *
 * Uses NEON PostgreSQL + Drizzle ORM exclusively
 */

import type { IStorage } from "../storage.js";
import { DirectPostgreSQLStorage } from "./postgresql-direct-storage.js";

class StorageSingleton {
  private static instance: IStorage | null = null;
  private static isInitializing = false;

  /**
   * Get the singleton instance of DirectPostgreSQLStorage
   * Thread-safe initialization with PostgreSQL-only architecture
   */
  public static getInstance(): IStorage {
    if (StorageSingleton.instance !== null) {
      return StorageSingleton.instance;
    }

    if (StorageSingleton.isInitializing) {
      throw new Error("Storage singleton is currently being initialized. Please wait.");
    }

    StorageSingleton.isInitializing = true;

    try {
      logger.info("[StorageSingleton] Initializing Direct PostgreSQL Storage...");

      // Initialize PostgreSQL-only storage (eliminates hybrid complexity)
      StorageSingleton.instance = new DirectPostgreSQLStorage();

      logger.info("[StorageSingleton] ✅ Direct PostgreSQL Storage initialized successfully");

      return StorageSingleton.instance;
    } catch (error) {
      logger.error("[StorageSingleton] ❌ Failed to initialize PostgreSQL storage:", error);
      throw new Error(
        `PostgreSQL storage initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      StorageSingleton.isInitializing = false;
    }
  }

  /**
   * Check if singleton is initialized
   */
  public static isInitialized(): boolean {
    return StorageSingleton.instance !== null;
  }

  /**
   * Reset the singleton (useful for testing)
   * @internal
   */
  public static reset(): void {
    logger.info("[StorageSingleton] Resetting singleton instance");
    StorageSingleton.instance = null;
    StorageSingleton.isInitializing = false;
  }

  /**
   * Get connection status information
   */
  public static getStatus(): {
    initialized: boolean;
    isInitializing: boolean;
    databaseUrl: boolean;
  } {
    return {
      initialized: StorageSingleton.instance !== null,
      isInitializing: StorageSingleton.isInitializing,
      databaseUrl: !!process.env.DATABASE_URL,
    };
  }
}

// Export the singleton instance getter
export const getStorage = () => StorageSingleton.getInstance();

// Export the class for advanced usage
export { StorageSingleton };

// Export type for TypeScript usage
export type StorageInstance = IStorage;
