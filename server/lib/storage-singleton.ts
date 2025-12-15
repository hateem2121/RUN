import { logger } from '../lib/smart-logger.js';
/**
 * DIRECT POSTGRESQL STORAGE SINGLETON
 * Provides single, shared PostgreSQL-only storage instance
 * Eliminates hybrid complexity for maximum reliability
 * 
 * Uses NEON PostgreSQL + Drizzle ORM exclusively
 */

import { DirectPostgreSQLStorage } from './postgresql-direct-storage.js';
import type { IStorage } from '../storage.js';


class StorageSingleton {
  private static instance: IStorage | null = null;
  private static isInitializing = false;

  /**
   * Get the singleton instance of DirectPostgreSQLStorage
   * Thread-safe initialization with PostgreSQL-only architecture
   */
  public static getInstance(): IStorage {
    if (this.instance !== null) {
      return this.instance;
    }

    if (this.isInitializing) {
      throw new Error('Storage singleton is currently being initialized. Please wait.');
    }

    this.isInitializing = true;

    try {
      logger.info('[StorageSingleton] Initializing Direct PostgreSQL Storage...');

      // Initialize PostgreSQL-only storage (eliminates hybrid complexity)
      this.instance = new DirectPostgreSQLStorage();

      logger.info('[StorageSingleton] ✅ Direct PostgreSQL Storage initialized successfully');

      return this.instance;
    } catch (error) {
      logger.error('[StorageSingleton] ❌ Failed to initialize PostgreSQL storage:', error);
      throw new Error(`PostgreSQL storage initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Check if singleton is initialized
   */
  public static isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Reset the singleton (useful for testing)
   * @internal
   */
  public static reset(): void {
    logger.info('[StorageSingleton] Resetting singleton instance');
    this.instance = null;
    this.isInitializing = false;
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
      initialized: this.instance !== null,
      isInitializing: this.isInitializing,
      databaseUrl: !!process.env.DATABASE_URL
    };
  }
}

// Export the singleton instance getter
export const getStorage = () => StorageSingleton.getInstance();

// Export the class for advanced usage
export { StorageSingleton };

// Export type for TypeScript usage
export type StorageInstance = IStorage;