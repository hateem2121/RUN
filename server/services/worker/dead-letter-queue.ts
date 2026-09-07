import fs from "node:fs";
import path from "node:path";
import { logger } from "../../lib/monitoring/logger.js";

export interface DeadLetterEntry {
  id: string;
  taskName: string;
  endpoint: string;
  payload?: unknown;
  headers?: Record<string, unknown> | undefined;
  retryCount?: number | undefined;
  reason?: string | undefined;
  error?: string | undefined;
  timestamp: string;
}

export interface DeadLetterQueueOptions {
  storageFile?: string;
  isTestMode?: boolean;
}

/**
 * UnrecoverableWorkerError
 *
 * Denotes a fatal, unrecoverable task failure that should bypass retries
 * and immediately route to the Dead-Letter Queue (DLQ).
 */
export class UnrecoverableWorkerError extends Error {
  readonly isUnrecoverable = true;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UnrecoverableWorkerError";
  }
}

/**
 * DeadLetterQueueService
 *
 * Records permanently failed or excessive-retry worker tasks to prevent
 * infinite Cloud Tasks retry loops. Stores entries in memory during test mode
 * or in `server/data/dlq.json` during standard operation.
 */
export class DeadLetterQueueService {
  private readonly storageFile: string;
  private readonly isTestMode: boolean;
  private memoryEntries: DeadLetterEntry[] = [];

  constructor(options: DeadLetterQueueOptions = {}) {
    this.isTestMode = options.isTestMode ?? process.env.NODE_ENV === "test";
    this.storageFile = options.storageFile ?? path.resolve(process.cwd(), "server/data/dlq.json");

    if (!this.isTestMode) {
      this.loadFromFile();
    }
  }

  /**
   * Returns current count of dead-lettered tasks.
   */
  getDlqCount(): number {
    return this.memoryEntries.length;
  }

  /**
   * Records a task to the dead-letter queue.
   */
  async record(
    entry: Omit<DeadLetterEntry, "id" | "timestamp"> & {
      id?: string;
      timestamp?: string;
    },
  ): Promise<DeadLetterEntry> {
    const fullEntry: DeadLetterEntry = {
      id: entry.id ?? `dlq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      taskName: entry.taskName,
      endpoint: entry.endpoint,
      payload: entry.payload,
      headers: entry.headers,
      retryCount: entry.retryCount,
      reason: entry.reason,
      error: entry.error,
      timestamp: entry.timestamp ?? new Date().toISOString(),
    };

    this.memoryEntries.push(fullEntry);

    logger.warn("[Worker:DLQ] Task recorded to Dead-Letter Queue", {
      id: fullEntry.id,
      taskName: fullEntry.taskName,
      endpoint: fullEntry.endpoint,
      retryCount: fullEntry.retryCount,
      reason: fullEntry.reason,
      worker_dlq_count: this.memoryEntries.length,
    });

    if (!this.isTestMode) {
      await this.persistToFile();
    }

    return fullEntry;
  }

  /**
   * Retrieves all dead-letter tasks.
   */
  async getEntries(): Promise<DeadLetterEntry[]> {
    return [...this.memoryEntries];
  }

  /**
   * Clears the dead-letter queue (in-memory and storage file).
   */
  async clear(): Promise<void> {
    this.memoryEntries = [];
    if (!this.isTestMode && fs.existsSync(this.storageFile)) {
      try {
        await fs.promises.writeFile(this.storageFile, JSON.stringify([], null, 2), "utf-8");
      } catch (err) {
        logger.error("[Worker:DLQ] Failed to clear DLQ file", { error: err });
      }
    }
  }

  /**
   * Loads existing DLQ entries from filesystem if available.
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const content = fs.readFileSync(this.storageFile, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          this.memoryEntries = parsed;
        }
      }
    } catch (err) {
      logger.error("[Worker:DLQ] Failed to read DLQ file, starting with empty queue", {
        error: err,
        storageFile: this.storageFile,
      });
      this.memoryEntries = [];
    }
  }

  /**
   * Persists in-memory entries to JSON file on disk.
   */
  private async persistToFile(): Promise<void> {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(
        this.storageFile,
        JSON.stringify(this.memoryEntries, null, 2),
        "utf-8",
      );
    } catch (err) {
      logger.error("[Worker:DLQ] Failed to persist DLQ entries to file", {
        error: err,
        storageFile: this.storageFile,
      });
    }
  }
}

/**
 * Singleton Dead-Letter Queue instance.
 */
export const deadLetterQueueService = new DeadLetterQueueService();
