import type { IStorage } from "../repositories/storage-interfaces.js";

/**
 * Storage Singleton
 * Manages the single instance of the storage provider (Memory, Postgres, etc.)
 * Used primarily for testing and legacy access patterns.
 */
export class StorageSingleton {
  private static instance: IStorage | null = null;

  static setInstance(storage: IStorage) {
    StorageSingleton.instance = storage;
  }

  static getInstance(): IStorage {
    if (!StorageSingleton.instance) {
      throw new Error(
        "Storage instance not initialized. Call StorageSingleton.setInstance() first.",
      );
    }
    return StorageSingleton.instance;
  }

  static hasInstance(): boolean {
    return !!StorageSingleton.instance;
  }
}

export function getStorage(): IStorage {
  return StorageSingleton.getInstance();
}
