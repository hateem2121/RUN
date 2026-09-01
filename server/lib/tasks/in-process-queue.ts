import { logger } from "../monitoring/logger.js";

export type TaskHandler<T = unknown> = (data: T) => Promise<void>;

interface QueuedTask<T = unknown> {
  id: string;
  type: string;
  data: T;
  retries: number;
  maxRetries: number;
  backoffMs: number;
  scheduledAt: number;
}

class InProcessTaskQueue {
  private handlers = new Map<string, TaskHandler<unknown>>();
  private queue: QueuedTask[] = [];
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  /**
   * Register a task handler for a specific task type.
   */
  public register<T>(type: string, handler: TaskHandler<T>): void {
    this.handlers.set(type, handler as TaskHandler<unknown>);
  }

  /**
   * Enqueue a background task for asynchronous execution.
   */
  public enqueue<T>(
    type: string,
    data: T,
    options?: {
      maxRetries?: number;
      delayMs?: number;
      backoffMs?: number;
    },
  ): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const task: QueuedTask<T> = {
      id,
      type,
      data,
      retries: 0,
      maxRetries: options?.maxRetries ?? 3,
      backoffMs: options?.backoffMs ?? 500,
      scheduledAt: Date.now() + (options?.delayMs ?? 0),
    };

    this.queue.push(task as QueuedTask<unknown>);
    logger.info(`[TaskQueue] Enqueued task ${id} of type "${type}"`);

    this.scheduleProcessing();
    return id;
  }

  private scheduleProcessing(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const now = Date.now();
    const nextTask = this.queue.reduce((earliest, task) =>
      task.scheduledAt < earliest.scheduledAt ? task : earliest,
    );

    const delay = Math.max(0, nextTask.scheduledAt - now);
    this.timer = setTimeout(() => {
      void this.processNext();
    }, delay);
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    const now = Date.now();
    const readyIndex = this.queue.findIndex((task) => task.scheduledAt <= now);
    if (readyIndex === -1) {
      this.scheduleProcessing();
      return;
    }

    const [task] = this.queue.splice(readyIndex, 1);
    if (!task) return;

    this.isProcessing = true;
    const handler = this.handlers.get(task.type);

    if (!handler) {
      logger.error(`[TaskQueue] No handler registered for task type: ${task.type}`);
      this.isProcessing = false;
      this.scheduleProcessing();
      return;
    }

    try {
      logger.info(`[TaskQueue] Processing task ${task.id} (${task.type})`);
      await handler(task.data);
      logger.info(`[TaskQueue] Successfully completed task ${task.id} (${task.type})`);
    } catch (error) {
      task.retries += 1;
      if (task.retries <= task.maxRetries) {
        const nextDelay = task.backoffMs * 2 ** (task.retries - 1);
        task.scheduledAt = Date.now() + nextDelay;
        this.queue.push(task);
        logger.warn(
          `[TaskQueue] Task ${task.id} failed (attempt ${task.retries}/${task.maxRetries}). Retrying in ${nextDelay}ms`,
          { error: error instanceof Error ? error.message : String(error) },
        );
      } else {
        logger.error(
          `[TaskQueue] Task ${task.id} permanently failed after ${task.maxRetries} attempts`,
          { error: error instanceof Error ? error.message : String(error) },
        );
      }
    } finally {
      this.isProcessing = false;
      this.scheduleProcessing();
    }
  }

  /**
   * Get queue metrics for observability.
   */
  public getMetrics() {
    return {
      queuedTasksCount: this.queue.length,
      isProcessing: this.isProcessing,
      registeredTypes: Array.from(this.handlers.keys()),
    };
  }
}

export const inProcessTaskQueue = new InProcessTaskQueue();
