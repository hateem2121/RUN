import { describe, expect, it } from "vitest";
import {
  concurrencyLimiter,
  WorkerConcurrencyLimiter,
} from "../../../services/worker/concurrency-limiter.js";

describe("WorkerConcurrencyLimiter", () => {
  it("exports a default singleton limiter with C=4", () => {
    expect(concurrencyLimiter).toBeInstanceOf(WorkerConcurrencyLimiter);
    expect(concurrencyLimiter.maxConcurrencyLimit).toBe(4);
    expect(concurrencyLimiter.activeCount).toBe(0);
    expect(concurrencyLimiter.queuedCount).toBe(0);
  });

  it("enforces max concurrency C=4 ceiling", async () => {
    const limiter = new WorkerConcurrencyLimiter({ maxConcurrency: 4 });
    let maxObservedActive = 0;
    let currentlyActive = 0;

    const runTask = async (id: number) => {
      return limiter.execute(`task-${id}`, async () => {
        currentlyActive++;
        if (currentlyActive > maxObservedActive) {
          maxObservedActive = currentlyActive;
        }
        await new Promise((resolve) => setTimeout(resolve, 30));
        currentlyActive--;
        return id;
      });
    };

    const taskPromises = Array.from({ length: 12 }, (_, i) => runTask(i));

    // While 12 tasks are in flight, activeCount must not exceed 4
    expect(limiter.activeCount).toBeLessThanOrEqual(4);

    const results = await Promise.all(taskPromises);

    expect(results).toHaveLength(12);
    expect(maxObservedActive).toBe(4);
    expect(limiter.activeCount).toBe(0);
    expect(limiter.queuedCount).toBe(0);
  });

  it("executes queued tasks in strict FIFO order", async () => {
    const limiter = new WorkerConcurrencyLimiter({ maxConcurrency: 2 });
    const executionOrder: number[] = [];

    let resolveFirstSlot: () => void = () => {};
    let resolveSecondSlot: () => void = () => {};

    // Block 2 active slots
    const slot1 = limiter.execute("blocking-1", () => {
      return new Promise<void>((res) => {
        resolveFirstSlot = res;
      });
    });
    const slot2 = limiter.execute("blocking-2", () => {
      return new Promise<void>((res) => {
        resolveSecondSlot = res;
      });
    });

    expect(limiter.activeCount).toBe(2);
    expect(limiter.queuedCount).toBe(0);

    // Queue 4 tasks while both slots are occupied
    const queuedPromises = [1, 2, 3, 4].map((id) =>
      limiter.execute(`task-${id}`, async () => {
        executionOrder.push(id);
        return id;
      }),
    );

    expect(limiter.queuedCount).toBe(4);

    // Free the first slot
    resolveFirstSlot();
    await slot1;

    // Wait a tick for queue progression
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Free the second slot
    resolveSecondSlot();
    await slot2;

    await Promise.all(queuedPromises);

    expect(executionOrder).toEqual([1, 2, 3, 4]);
    expect(limiter.activeCount).toBe(0);
    expect(limiter.queuedCount).toBe(0);
  });

  it("rejects queued tasks if queue timeout is exceeded", async () => {
    const limiter = new WorkerConcurrencyLimiter({
      maxConcurrency: 1,
      queueTimeoutMs: 40,
    });

    // Block the single slot for 100ms
    const blocking = limiter.execute("slow-task", async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return "done";
    });

    // Queue task with 40ms timeout
    const queuedTask = limiter.execute("timeout-task", async () => {
      return "should not run";
    });

    await expect(queuedTask).rejects.toThrow(/Worker concurrency queue timeout exceeded/);

    await blocking;
    expect(limiter.activeCount).toBe(0);
    expect(limiter.queuedCount).toBe(0);
  });

  it("recovers and continues queue processing when a task fails", async () => {
    const limiter = new WorkerConcurrencyLimiter({ maxConcurrency: 1 });

    const failingTask = limiter.execute("failing", async () => {
      throw new Error("Deliberate worker error");
    });

    const nextTask = limiter.execute("following", async () => {
      return "success";
    });

    await expect(failingTask).rejects.toThrow("Deliberate worker error");
    await expect(nextTask).resolves.toBe("success");

    expect(limiter.activeCount).toBe(0);
    expect(limiter.queuedCount).toBe(0);
  });

  it("clears all queued tasks on clear()", async () => {
    const limiter = new WorkerConcurrencyLimiter({ maxConcurrency: 1 });

    let resolveActive: () => void = () => {};
    const active = limiter.execute("active", () => {
      return new Promise<string>((res) => {
        resolveActive = () => res("active done");
      });
    });

    const queued1 = limiter.execute("q1", async () => "q1 done");
    const queued2 = limiter.execute("q2", async () => "q2 done");

    expect(limiter.queuedCount).toBe(2);

    limiter.clear();
    expect(limiter.queuedCount).toBe(0);

    await expect(queued1).rejects.toThrow("Worker concurrency queue cleared");
    await expect(queued2).rejects.toThrow("Worker concurrency queue cleared");

    resolveActive();
    await expect(active).resolves.toBe("active done");
  });
});
