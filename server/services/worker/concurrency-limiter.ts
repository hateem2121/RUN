export interface WorkerConcurrencyLimiterOptions {
  maxConcurrency?: number;
  queueTimeoutMs?: number;
}

interface QueuedTask<T> {
  taskName: string;
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  timeoutId?: NodeJS.Timeout | undefined;
  queuedAt: number;
}

/**
 * WorkerConcurrencyLimiter
 *
 * Implements bounded worker concurrency ceiling (default C=4) with bounded FIFO queuing
 * and timeout rejection for Cloud Tasks worker endpoints.
 */
export class WorkerConcurrencyLimiter {
  private readonly maxConcurrency: number;
  private readonly queueTimeoutMs: number;
  private _activeCount = 0;
  private queue: Array<QueuedTask<unknown>> = [];

  constructor(options: WorkerConcurrencyLimiterOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 4;
    this.queueTimeoutMs = options.queueTimeoutMs ?? 30_000;
  }

  /**
   * Current number of actively executing worker tasks.
   */
  get activeCount(): number {
    return this._activeCount;
  }

  /**
   * Current number of tasks waiting in the FIFO queue.
   */
  get queuedCount(): number {
    return this.queue.length;
  }

  /**
   * Maximum allowed concurrent task executions.
   */
  get maxConcurrencyLimit(): number {
    return this.maxConcurrency;
  }

  /**
   * Bounded queue timeout in milliseconds.
   */
  get queueTimeout(): number {
    return this.queueTimeoutMs;
  }

  /**
   * Executes a worker task within the concurrency limit.
   * If concurrency is saturated (active >= maxConcurrency), the task is queued in FIFO order.
   * If queue wait time exceeds queueTimeoutMs, the task is rejected with a timeout error.
   */
  async execute<T>(taskName: string, fn: () => Promise<T>): Promise<T> {
    if (this._activeCount < this.maxConcurrency) {
      return this.runTask(taskName, fn);
    }

    return new Promise<T>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const item: QueuedTask<T> = {
        taskName,
        fn,
        resolve,
        reject,
        queuedAt: Date.now(),
      };

      if (this.queueTimeoutMs > 0 && Number.isFinite(this.queueTimeoutMs)) {
        timeoutId = setTimeout(() => {
          const index = this.queue.indexOf(item as QueuedTask<unknown>);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(
              new Error(
                `Worker concurrency queue timeout exceeded (${this.queueTimeoutMs}ms) for task: ${taskName}`,
              ),
            );
          }
        }, this.queueTimeoutMs);
      }

      item.timeoutId = timeoutId;
      this.queue.push(item as QueuedTask<unknown>);
    });
  }

  /**
   * Dispatches the next queued tasks if active count is below maximum concurrency.
   */
  private processNext(): void {
    while (this._activeCount < this.maxConcurrency && this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (!nextTask) break;

      if (nextTask.timeoutId) {
        clearTimeout(nextTask.timeoutId);
      }

      this.runTask(nextTask.taskName, nextTask.fn).then(nextTask.resolve).catch(nextTask.reject);
    }
  }

  /**
   * Runs the given task, updating active count and triggering next queue item upon completion.
   */
  private async runTask<T>(_taskName: string, fn: () => Promise<T>): Promise<T> {
    this._activeCount++;
    try {
      return await fn();
    } finally {
      this._activeCount--;
      this.processNext();
    }
  }

  /**
   * Resets the limiter, draining and rejecting any pending queued items.
   */
  clear(): void {
    for (const item of this.queue) {
      if (item.timeoutId) {
        clearTimeout(item.timeoutId);
      }
      item.reject(new Error("Worker concurrency queue cleared"));
    }
    this.queue = [];
  }
}

/**
 * Singleton worker concurrency limiter instance with C=4.
 */
export const concurrencyLimiter = new WorkerConcurrencyLimiter({
  maxConcurrency: 4,
  queueTimeoutMs: 30_000,
});
