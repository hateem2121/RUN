import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { database as dbConfig } from "../../../../../server/config/environment";
import { adminCacheManager } from "../../../../../server/lib/cache/admin-cache";
import { adminNotifier } from "../../../../../server/lib/integrations/admin-notifier";
import { logger } from "../../../../../server/lib/monitoring/logger";
import { registerShutdownHook } from "../../../../../server/lib/shutdown-manager";

// Mock Client
const mockClientConnect = vi.fn();
const mockClientEnd = vi.fn();
const mockClientQuery = vi.fn();
const mockClientOn = vi.fn();

vi.mock("pg", () => ({
  Client: class {
    connect = mockClientConnect;
    end = mockClientEnd;
    query = mockClientQuery;
    on = mockClientOn;
  },
}));

vi.mock("../../../../../server/config/environment", () => ({
  database: {
    url: "postgres://user:pass@host:5432/db",
    directUrl: "postgres://user:pass@host:5432/db_direct",
    ssl: false,
  },
}));

vi.mock("../../../../../server/lib/cache/admin-cache", () => ({
  adminCacheManager: {
    clearUser: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/shutdown-manager", () => ({
  registerShutdownHook: vi.fn(),
}));

describe("Admin Notifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockClientConnect.mockResolvedValue(undefined);
    mockClientQuery.mockResolvedValue(undefined);
    dbConfig.directUrl = "postgres://user:pass@host:5432/db_direct";
  });

  afterEach(async () => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    await adminNotifier.stop();
  });

  describe("start", () => {
    it("should connect to pg client and listen on channel", async () => {
      await adminNotifier.start();

      expect(mockClientConnect).toHaveBeenCalled();
      expect(mockClientQuery).toHaveBeenCalledWith("LISTEN admin_cache_clear");
      expect(mockClientOn).toHaveBeenCalledWith("notification", expect.any(Function));
      expect(mockClientOn).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockClientOn).toHaveBeenCalledWith("end", expect.any(Function));
      expect(registerShutdownHook).toHaveBeenCalled();
    });

    it("should ignore subsequent start calls", async () => {
      await adminNotifier.start();
      await adminNotifier.start();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("start() called twice"));
    });

    it("should throw or warn if no directUrl in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      dbConfig.directUrl = "";

      // Since VITEST is usually set, let's unset it temporarily if it exists to test the throw condition
      const originalVitest = process.env.VITEST;
      delete process.env.VITEST;

      await expect(adminNotifier.start()).rejects.toThrow("DIRECT_DATABASE_URL is required");

      process.env.NODE_ENV = originalEnv;
      if (originalVitest !== undefined) process.env.VITEST = originalVitest;
    });

    it("should warn and return if no directUrl in non-production/test", async () => {
      dbConfig.directUrl = "";
      await adminNotifier.start();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("DIRECT_DATABASE_URL not configured"),
      );
    });

    it("should reconnect on error", async () => {
      await adminNotifier.start();

      // Simulate error event
      const errorCallback = mockClientOn.mock.calls.find((c) => c[0] === "error")[1];
      errorCallback(new Error("Connection lost"));

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Listener connection error"),
        expect.any(Error),
      );

      // Fast forward to trigger reconnect
      vi.advanceTimersByTime(1000);

      expect(mockClientConnect).toHaveBeenCalledTimes(2);
    });

    it("should reconnect on end", async () => {
      await adminNotifier.start();

      // Simulate end event
      const endCallback = mockClientOn.mock.calls.find((c) => c[0] === "end")[1];
      endCallback();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Listener connection ended"),
      );

      // Fast forward to trigger reconnect
      vi.advanceTimersByTime(1000);

      expect(mockClientConnect).toHaveBeenCalledTimes(2);
    });

    it("should handle notification events", async () => {
      await adminNotifier.start();

      const notificationCallback = mockClientOn.mock.calls.find((c) => c[0] === "notification")[1];

      // Global invalidation
      notificationCallback({ channel: "admin_cache_clear", payload: "ALL" });
      expect(adminCacheManager.clear).toHaveBeenCalled();

      // User invalidation
      notificationCallback({ channel: "admin_cache_clear", payload: "user-123" });
      expect(adminCacheManager.clearUser).toHaveBeenCalledWith("user-123");
    });
  });

  describe("stop", () => {
    it("should disconnect client and clear timers", async () => {
      await adminNotifier.start();
      await adminNotifier.stop();

      expect(mockClientEnd).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Listener stopped"));
    });

    it("should handle client end error gracefully", async () => {
      await adminNotifier.start();
      mockClientEnd.mockRejectedValueOnce(new Error("End failed"));

      await adminNotifier.stop();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Error stopping listener"),
        expect.any(Error),
      );
    });
  });

  describe("notify", () => {
    it("should send notification for specific user using listener client", async () => {
      await adminNotifier.start();
      await adminNotifier.notify("user-456");

      expect(mockClientQuery).toHaveBeenCalledWith("SELECT pg_notify($1, $2)", [
        "admin_cache_clear",
        "user-456",
      ]);
    });

    it("should send ALL notification if no user specified", async () => {
      await adminNotifier.start();
      await adminNotifier.notify();

      expect(mockClientQuery).toHaveBeenCalledWith("SELECT pg_notify($1, $2)", [
        "admin_cache_clear",
        "ALL",
      ]);
    });

    it("should use temp client if listener is not connected", async () => {
      // Don't start notifier
      await adminNotifier.notify("user-789");

      expect(mockClientConnect).toHaveBeenCalled();
      expect(mockClientQuery).toHaveBeenCalledWith("SELECT pg_notify($1, $2)", [
        "admin_cache_clear",
        "user-789",
      ]);
      expect(mockClientEnd).toHaveBeenCalled();
    });

    it("should gracefully handle notify errors", async () => {
      mockClientQuery.mockRejectedValueOnce(new Error("Notify failed"));

      await adminNotifier.notify();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to broadcast notification"),
        expect.any(Error),
      );
    });
  });
});
