import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We use dynamic imports in tests to cleanly re-evaluate module-level environment variables
// and to properly inject doMock configurations per test run.
type MediaQueueService =
  typeof import("../../../../../server/services/tasks/media-queue.service.js");

describe("media-queue.service", () => {
  let mockCreateTask: ReturnType<typeof vi.fn>;
  let mockGetQueue: ReturnType<typeof vi.fn>;
  let mockQueuePath: ReturnType<typeof vi.fn>;
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockCreateTask = vi
      .fn()
      .mockResolvedValue([{ name: "projects/test/locations/us/queues/media/tasks/123" }]);
    mockGetQueue = vi.fn().mockResolvedValue([{ name: "test-queue", state: "RUNNING" }]);
    mockQueuePath = vi.fn().mockReturnValue("mock-queue-path");

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    vi.doMock("@google-cloud/tasks", () => {
      return {
        CloudTasksClient: class {
          createTask = mockCreateTask;
          getQueue = mockGetQueue;
          queuePath = mockQueuePath;
        },
      };
    });

    vi.doMock("../../../../../server/lib/monitoring/logger.js", () => ({
      logger: mockLogger,
    }));

    // Default envs for successful cases
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
    vi.stubEnv("CLOUD_TASKS_LOCATION", "us-central1");
    vi.stubEnv("MEDIA_QUEUE_NAME", "media-processing");
    vi.stubEnv("CLOUD_RUN_SERVICE_URL", "https://test.run.app");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function loadService(): Promise<MediaQueueService> {
    return await import("../../../../../server/services/tasks/media-queue.service.js");
  }

  describe("queueMediaProcessing", () => {
    it("should return a dev task when NODE_ENV is development", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const service = await loadService();

      const result = await service.queueMediaProcessing({ mediaId: "123", operation: "optimize" });

      expect(result.success).toBe(true);
      expect(result.taskName).toMatch(/^dev-task-/);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[MediaQueue] Development mode - skipping Cloud Tasks queue",
        expect.objectContaining({ mediaId: "123", operation: "optimize" }),
      );
    });

    it("should return a dev task when NODE_ENV is test", async () => {
      vi.stubEnv("NODE_ENV", "test");
      const service = await loadService();

      const result = await service.queueMediaProcessing({ mediaId: "123", operation: "optimize" });

      expect(result.success).toBe(true);
      expect(result.taskName).toMatch(/^dev-task-/);
    });

    it("should fail if GOOGLE_CLOUD_PROJECT is missing", async () => {
      vi.stubEnv("GOOGLE_CLOUD_PROJECT", "");
      vi.stubEnv("GCP_PROJECT_ID", "");
      const service = await loadService();

      const result = await service.queueMediaProcessing({ mediaId: "123", operation: "optimize" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing project ID");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "[MediaQueue] Missing GOOGLE_CLOUD_PROJECT environment variable",
      );
    });

    it("should successfully queue a task without delay", async () => {
      const service = await loadService();

      const result = await service.queueMediaProcessing({ mediaId: "123", operation: "optimize" });

      expect(result.success).toBe(true);
      expect(result.taskName).toBe("projects/test/locations/us/queues/media/tasks/123");
      expect(mockQueuePath).toHaveBeenCalledWith("test-project", "us-central1", "media-processing");
      expect(mockCreateTask).toHaveBeenCalledTimes(1);

      const createTaskArg = mockCreateTask.mock.calls[0][0];
      expect(createTaskArg.parent).toBe("mock-queue-path");
      expect(createTaskArg.task.httpRequest.url).toBe(
        "https://test.run.app/api/worker/process-media",
      );
      expect(createTaskArg.task.httpRequest.body).toBeDefined();

      const bodyDecoded = Buffer.from(createTaskArg.task.httpRequest.body, "base64").toString();
      expect(JSON.parse(bodyDecoded)).toEqual({ mediaId: "123", operation: "optimize" });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "[MediaQueue] Task queued successfully",
        expect.objectContaining({ taskName: result.taskName }),
      );
    });

    it("should successfully queue a task with delaySeconds", async () => {
      const service = await loadService();

      const result = await service.queueMediaProcessing(
        { mediaId: "123", operation: "optimize" },
        60,
      );

      expect(result.success).toBe(true);
      expect(mockCreateTask).toHaveBeenCalledTimes(1);

      const createTaskArg = mockCreateTask.mock.calls[0][0];
      expect(createTaskArg.task.scheduleTime.seconds).toBeDefined();
      expect(result.scheduledTime?.getTime()).toBeGreaterThan(Date.now()); // Future time
    });

    it("should handle CloudTasksClient createTask errors gracefully", async () => {
      mockCreateTask.mockRejectedValue(new Error("GCP Error"));
      const service = await loadService();

      const result = await service.queueMediaProcessing({ mediaId: "123", operation: "optimize" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("GCP Error");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "[MediaQueue] Failed to queue task",
        expect.objectContaining({ error: "GCP Error" }),
      );
    });

    it("should handle non-Error objects thrown", async () => {
      mockCreateTask.mockRejectedValue("String Error");
      const service = await loadService();

      const result = await service.queueMediaProcessing({ mediaId: "123", operation: "optimize" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });
  });

  describe("queueMediaOperations", () => {
    it("should queue multiple operations sequentially", async () => {
      const service = await loadService();

      const results = await service.queueMediaOperations("123", ["optimize", "generate-thumbnail"]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockCreateTask).toHaveBeenCalledTimes(2);
    });
  });

  describe("getQueueStats", () => {
    it("should return null if PROJECT_ID is missing", async () => {
      vi.stubEnv("GOOGLE_CLOUD_PROJECT", "");
      vi.stubEnv("GCP_PROJECT_ID", "");
      const service = await loadService();

      const stats = await service.getQueueStats();

      expect(stats).toBeNull();
    });

    it("should successfully return queue stats", async () => {
      const service = await loadService();

      const stats = await service.getQueueStats();

      expect(stats).not.toBeNull();
      expect(stats?.name).toBe("test-queue");
      expect(stats?.state).toBe("RUNNING");
      expect(mockGetQueue).toHaveBeenCalledTimes(1);
    });

    it("should fallback to QUEUE_NAME if queue.name is missing", async () => {
      mockGetQueue.mockResolvedValue([{}]);
      const service = await loadService();

      const stats = await service.getQueueStats();

      expect(stats).not.toBeNull();
      expect(stats?.name).toBe("media-processing");
      expect(stats?.state).toBe("UNKNOWN");
    });

    it("should handle getQueue errors gracefully and return null", async () => {
      mockGetQueue.mockRejectedValue(new Error("Stats error"));
      const service = await loadService();

      const stats = await service.getQueueStats();

      expect(stats).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "[MediaQueue] Failed to get queue stats",
        expect.any(Object),
      );
    });
  });
});
