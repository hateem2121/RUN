import { beforeEach, describe, expect, it } from "vitest";
import {
  DeadLetterQueueService,
  deadLetterQueueService,
  UnrecoverableWorkerError,
} from "../../../services/worker/dead-letter-queue.js";

describe("DeadLetterQueueService", () => {
  let dlq: DeadLetterQueueService;

  beforeEach(async () => {
    dlq = new DeadLetterQueueService({ isTestMode: true });
    await deadLetterQueueService.clear();
  });

  it("exports a default singleton DLQ service", () => {
    expect(deadLetterQueueService).toBeInstanceOf(DeadLetterQueueService);
  });

  it("records dead-letter tasks into memory during test mode", async () => {
    expect(dlq.getDlqCount()).toBe(0);

    const recorded = await dlq.record({
      taskName: "test-task",
      endpoint: "/api/worker/send-email",
      payload: { id: 123 },
      headers: { "x-cloudtasks-taskretrycount": "6" },
      retryCount: 6,
      reason: "Max retries exceeded",
    });

    expect(recorded.id).toBeDefined();
    expect(recorded.taskName).toBe("test-task");
    expect(recorded.retryCount).toBe(6);
    expect(recorded.reason).toBe("Max retries exceeded");
    expect(dlq.getDlqCount()).toBe(1);

    const entries = await dlq.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe(recorded.id);
  });

  it("supports UnrecoverableWorkerError instance flag", () => {
    const err = new UnrecoverableWorkerError("Fatal unrecoverable failure");
    expect(err.name).toBe("UnrecoverableWorkerError");
    expect(err.isUnrecoverable).toBe(true);
    expect(err.message).toBe("Fatal unrecoverable failure");
  });

  it("clears dead-letter tasks on clear()", async () => {
    await dlq.record({
      taskName: "task-1",
      endpoint: "/test",
      reason: "error",
    });
    expect(dlq.getDlqCount()).toBe(1);

    await dlq.clear();
    expect(dlq.getDlqCount()).toBe(0);
    const entries = await dlq.getEntries();
    expect(entries).toHaveLength(0);
  });
});
