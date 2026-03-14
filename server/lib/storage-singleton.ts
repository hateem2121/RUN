import type { IStorage } from "../repositories/storage-interfaces.js";

/**
 * Storage Singleton
 * Manages the single instance of the storage provider (Memory, Postgres, etc.)
 * Used primarily for testing and legacy access patterns.
 */
let storageInstance: IStorage | null = null;

export const StorageSingleton = {
  setInstance: (storage: IStorage) => {
    storageInstance = storage;
  },

  getInstance: (): IStorage => {
    if (!storageInstance) {
      throw new Error(
        "Storage instance not initialized. Call StorageSingleton.setInstance() first.",
      );
    }
    return storageInstance;
  },

  hasInstance: (): boolean => {
    return !!storageInstance;
  },
};

export function getStorage(): IStorage {
  return StorageSingleton.getInstance();
}
