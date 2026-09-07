export interface GltfCacheEntry {
  url: string;
  buffer: ArrayBuffer;
  size: number;
  timestamp: number;
  lastAccessed: number;
}

export class GltfCacheService {
  private dbName = "run_gltf_cache";
  private storeName = "models";
  private dbVersion = 1;
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryFallback: Map<string, GltfCacheEntry> = new Map();
  private isIndexedDBEnabled = true;
  private accessCounter = 0;

  public static readonly DEFAULT_MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB
  public static readonly DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  private nextTimestamp(): number {
    this.accessCounter += 1;
    return Date.now() + this.accessCounter * 0.001;
  }

  constructor(options?: { dbName?: string; storeName?: string; enableIndexedDB?: boolean }) {
    if (options?.dbName) this.dbName = options.dbName;
    if (options?.storeName) this.storeName = options.storeName;
    if (options?.enableIndexedDB !== undefined) this.isIndexedDBEnabled = options.enableIndexedDB;
  }

  /**
   * For testing or environments requiring explicit memory fallback.
   */
  public setIndexedDBEnabled(enabled: boolean): void {
    this.isIndexedDBEnabled = enabled;
    this.dbPromise = null;
  }

  private getDb(): Promise<IDBDatabase | null> {
    if (!this.isIndexedDBEnabled || typeof indexedDB === "undefined") {
      return Promise.resolve(null);
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: "url" });
            store.createIndex("lastAccessed", "lastAccessed", { unique: false });
            store.createIndex("timestamp", "timestamp", { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          this.isIndexedDBEnabled = false;
          resolve(null);
        };

        request.onblocked = () => {
          resolve(null);
        };
      } catch {
        this.isIndexedDBEnabled = false;
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Retrieves a cached 3D model buffer and updates its lastAccessed timestamp.
   */
  async getModel(url: string): Promise<ArrayBuffer | null> {
    const db = await this.getDb();
    if (!db) {
      const entry = this.memoryFallback.get(url);
      if (entry) {
        entry.lastAccessed = this.nextTimestamp();
        return entry.buffer;
      }
      return null;
    }

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(url);

        request.onsuccess = () => {
          const entry = request.result as GltfCacheEntry | undefined;
          if (!entry) {
            resolve(null);
            return;
          }

          entry.lastAccessed = this.nextTimestamp();
          store.put(entry);
          resolve(entry.buffer);
        };

        request.onerror = () => {
          const entry = this.memoryFallback.get(url);
          resolve(entry ? entry.buffer : null);
        };
      } catch {
        const entry = this.memoryFallback.get(url);
        resolve(entry ? entry.buffer : null);
      }
    });
  }

  /**
   * Stores a 3D model buffer into cache with size and timestamp metadata.
   */
  async saveModel(url: string, buffer: ArrayBuffer): Promise<void> {
    const now = this.nextTimestamp();
    const entry: GltfCacheEntry = {
      url,
      buffer,
      size: buffer.byteLength,
      timestamp: now,
      lastAccessed: now,
    };

    const db = await this.getDb();
    if (!db) {
      this.memoryFallback.set(url, entry);
      return;
    }

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(entry);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          this.memoryFallback.set(url, entry);
          resolve();
        };
      } catch {
        this.memoryFallback.set(url, entry);
        resolve();
      }
    });
  }

  /**
   * Fetches a 3D model with cache-first strategy, returning an object URL.
   */
  async fetchWithCache(url: string): Promise<string> {
    const cachedBuffer = await this.getModel(url);
    if (cachedBuffer) {
      const blob = new Blob([cachedBuffer], { type: "model/gltf-binary" });
      return typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(blob)
        : url;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch 3D model from ${url}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await this.saveModel(url, buffer);
    await this.pruneCache();

    const blob = new Blob([buffer], { type: "model/gltf-binary" });
    return typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
      ? URL.createObjectURL(blob)
      : url;
  }

  /**
   * Evicts expired models (>30 days) and LRU models if total size exceeds budget.
   */
  async pruneCache(
    maxTotalBytes: number = GltfCacheService.DEFAULT_MAX_TOTAL_BYTES,
    maxAgeMs: number = GltfCacheService.DEFAULT_MAX_AGE_MS,
  ): Promise<number> {
    const now = Date.now();
    const db = await this.getDb();
    let evictedCount = 0;

    if (!db) {
      const entries = Array.from(this.memoryFallback.values());
      for (const entry of entries) {
        if (now - entry.timestamp > maxAgeMs) {
          this.memoryFallback.delete(entry.url);
          evictedCount++;
        }
      }

      let currentTotal = Array.from(this.memoryFallback.values()).reduce(
        (sum, e) => sum + e.size,
        0,
      );

      if (currentTotal > maxTotalBytes) {
        const sorted = Array.from(this.memoryFallback.values()).sort(
          (a, b) => a.lastAccessed - b.lastAccessed,
        );
        for (const entry of sorted) {
          if (currentTotal <= maxTotalBytes) break;
          this.memoryFallback.delete(entry.url);
          currentTotal -= entry.size;
          evictedCount++;
        }
      }

      return evictedCount;
    }

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const entries = (getAllRequest.result as GltfCacheEntry[]) || [];
          const toDelete: string[] = [];

          const validEntries: GltfCacheEntry[] = [];
          for (const entry of entries) {
            if (now - entry.timestamp > maxAgeMs) {
              toDelete.push(entry.url);
            } else {
              validEntries.push(entry);
            }
          }

          let totalBytes = validEntries.reduce((sum, e) => sum + e.size, 0);
          if (totalBytes > maxTotalBytes) {
            validEntries.sort((a, b) => a.lastAccessed - b.lastAccessed);
            for (const entry of validEntries) {
              if (totalBytes <= maxTotalBytes) break;
              toDelete.push(entry.url);
              totalBytes -= entry.size;
            }
          }

          if (toDelete.length === 0) {
            resolve(0);
            return;
          }

          transaction.oncomplete = () => resolve(evictedCount);
          transaction.onerror = () => resolve(evictedCount);

          for (const url of toDelete) {
            store.delete(url);
            evictedCount++;
          }
        };

        getAllRequest.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * Purges all models from cache.
   */
  async clearCache(): Promise<void> {
    this.memoryFallback.clear();
    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const gltfCache = new GltfCacheService();
