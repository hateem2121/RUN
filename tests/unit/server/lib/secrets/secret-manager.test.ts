/**
 * Tests for Google Secret Manager Integration
 *
 * Tests secret loading, caching, and environment fallback behavior.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Secret Manager client before importing the module
const mockAccessSecretVersion = vi.fn();

// Create a proper mock class constructor
class MockSecretManagerServiceClient {
  accessSecretVersion = mockAccessSecretVersion;
}

vi.mock("@google-cloud/secret-manager", () => ({
  SecretManagerServiceClient: MockSecretManagerServiceClient,
}));

// Mock the logger
vi.mock("../../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Store original environment
const originalEnv = { ...process.env };

describe("SecretManager", () => {
  let secretManager: typeof import("../secret-manager.ts");

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };

    // Reset modules to clear cached secrets
    vi.resetModules();

    // Re-import the module fresh for each test
    secretManager = await import("../secret-manager.ts");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("loadSecrets", () => {
    it("should bypass Secret Manager in development mode", async () => {
      process.env.NODE_ENV = "development";

      const result = await secretManager.loadSecrets();

      expect(result).toEqual({});
      expect(mockAccessSecretVersion).not.toHaveBeenCalled();
    });

    it("should bypass Secret Manager when SKIP_SECRET_MANAGER is true", async () => {
      process.env.NODE_ENV = "production";
      process.env.SKIP_SECRET_MANAGER = "true";

      const result = await secretManager.loadSecrets();

      expect(result).toEqual({});
      expect(mockAccessSecretVersion).not.toHaveBeenCalled();
    });

    it("should return empty object when GOOGLE_CLOUD_PROJECT is not set", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.GOOGLE_CLOUD_PROJECT;

      const result = await secretManager.loadSecrets();

      expect(result).toEqual({});
      expect(mockAccessSecretVersion).not.toHaveBeenCalled();
    });

    it("should handle errors from Secret Manager gracefully", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockRejectedValue(new Error("API Error"));

      const result = await secretManager.loadSecrets();

      // Should return empty object on error
      expect(result).toEqual({});
    });

    it("should handle empty payload gracefully", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockResolvedValue([{ payload: { data: null } }]);

      const result = await secretManager.loadSecrets();

      // Should have empty object since all payloads were null
      expect(Object.keys(result).length).toBe(0);
    });

    it("should handle missing payload gracefully", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockResolvedValue([{ payload: undefined }]);

      const result = await secretManager.loadSecrets();

      expect(Object.keys(result).length).toBe(0);
    });

    it("should load secrets from Secret Manager in production with Buffer payload", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockImplementation(({ name }: { name: string }) => {
        const secretName = name.split("/")[3];
        return [{ payload: { data: Buffer.from(`${secretName}-value`) } }];
      });

      const result = await secretManager.loadSecrets();

      expect(result).toHaveProperty("DATABASE_URL", "DATABASE_URL-value");
      expect(result).toHaveProperty("SESSION_SECRET", "SESSION_SECRET-value");
      expect(result).toHaveProperty("GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET-value");
      expect(result).toHaveProperty("UPSTASH_REDIS_REST_TOKEN", "UPSTASH_REDIS_REST_TOKEN-value");
    });

    it("should handle string payload from Secret Manager", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockResolvedValue([{ payload: { data: "string-secret-value" } }]);

      const result = await secretManager.loadSecrets();

      expect(result).toHaveProperty("DATABASE_URL", "string-secret-value");
    });

    it("should handle ArrayBuffer payload from Secret Manager", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      const encoder = new TextEncoder();
      const arrayBuffer = encoder.encode("arraybuffer-secret-value");

      mockAccessSecretVersion.mockResolvedValue([{ payload: { data: arrayBuffer } }]);

      const result = await secretManager.loadSecrets();

      expect(result).toHaveProperty("DATABASE_URL", "arraybuffer-secret-value");
    });

    it("should return cached secrets on subsequent calls", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockImplementation(({ name }: { name: string }) => {
        const secretName = name.split("/")[3];
        return [{ payload: { data: Buffer.from(`${secretName}-cached`) } }];
      });

      // First call
      const result1 = await secretManager.loadSecrets();

      // Second call should return cached result
      const result2 = await secretManager.loadSecrets();

      expect(result1).toBe(result2);
      // Should only call the API once per secret due to caching
      expect(mockAccessSecretVersion).toHaveBeenCalledTimes(4); // 4 managed secrets
    });
  });

  describe("getSecret", () => {
    it("should fall back to environment variable when not in cache", async () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "env-database-url";

      await secretManager.loadSecrets();
      const secret = secretManager.getSecret("DATABASE_URL");

      expect(secret).toBe("env-database-url");
    });

    it("should return undefined when secret is not available", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.DATABASE_URL;

      await secretManager.loadSecrets();
      const secret = secretManager.getSecret("DATABASE_URL");

      expect(secret).toBeUndefined();
    });

    it("should return SESSION_SECRET from environment", async () => {
      process.env.NODE_ENV = "development";
      process.env.SESSION_SECRET = "my-session-secret";

      await secretManager.loadSecrets();
      const secret = secretManager.getSecret("SESSION_SECRET");

      expect(secret).toBe("my-session-secret");
    });

    it("should return GOOGLE_CLIENT_SECRET from environment", async () => {
      process.env.NODE_ENV = "development";
      process.env.GOOGLE_CLIENT_SECRET = "my-google-secret";

      await secretManager.loadSecrets();
      const secret = secretManager.getSecret("GOOGLE_CLIENT_SECRET");

      expect(secret).toBe("my-google-secret");
    });

    it("should return UPSTASH_REDIS_REST_TOKEN from environment", async () => {
      process.env.NODE_ENV = "development";
      process.env.UPSTASH_REDIS_REST_TOKEN = "my-redis-token";

      await secretManager.loadSecrets();
      const secret = secretManager.getSecret("UPSTASH_REDIS_REST_TOKEN");

      expect(secret).toBe("my-redis-token");
    });

    it("should return secret from cache when available", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockResolvedValue([
        { payload: { data: Buffer.from("cached-secret-value") } },
      ]);

      await secretManager.loadSecrets();
      const secret = secretManager.getSecret("DATABASE_URL");

      expect(secret).toBe("cached-secret-value");
    });
  });

  describe("injectSecretsToEnv", () => {
    it("should inject loaded secrets into process.env", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      delete process.env.DATABASE_URL;

      mockAccessSecretVersion.mockResolvedValue([
        { payload: { data: Buffer.from("injected-secret") } },
      ]);

      await secretManager.loadSecrets();
      secretManager.injectSecretsToEnv();

      expect(process.env.DATABASE_URL).toBe("injected-secret");
    });

    it("should not overwrite existing environment variables", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";
      process.env.DATABASE_URL = "existing-value";

      mockAccessSecretVersion.mockResolvedValue([{ payload: { data: Buffer.from("new-value") } }]);

      await secretManager.loadSecrets();
      secretManager.injectSecretsToEnv();

      // Should keep existing value
      expect(process.env.DATABASE_URL).toBe("existing-value");
    });

    it("should warn when no secrets are loaded", async () => {
      process.env.NODE_ENV = "development";

      // Should not throw, just warn
      expect(() => secretManager.injectSecretsToEnv()).not.toThrow();
    });
  });

  describe("hasRequiredSecrets", () => {
    it("should return true when all required secrets are available", async () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://localhost:5432/test";
      process.env.SESSION_SECRET = "my-session-secret";

      await secretManager.loadSecrets();
      const result = secretManager.hasRequiredSecrets();

      expect(result).toBe(true);
    });

    it("should return false when DATABASE_URL is missing", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.DATABASE_URL;
      process.env.SESSION_SECRET = "my-session-secret";

      await secretManager.loadSecrets();
      const result = secretManager.hasRequiredSecrets();

      expect(result).toBe(false);
    });

    it("should return false when SESSION_SECRET is missing", async () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://localhost:5432/test";
      delete process.env.SESSION_SECRET;

      await secretManager.loadSecrets();
      const result = secretManager.hasRequiredSecrets();

      expect(result).toBe(false);
    });

    it("should return false when both required secrets are missing", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.DATABASE_URL;
      delete process.env.SESSION_SECRET;

      await secretManager.loadSecrets();
      const result = secretManager.hasRequiredSecrets();

      expect(result).toBe(false);
    });

    it("should return true when secrets are loaded from Secret Manager", async () => {
      process.env.NODE_ENV = "production";
      process.env.GOOGLE_CLOUD_PROJECT = "test-project";

      mockAccessSecretVersion.mockImplementation(({ name }: { name: string }) => {
        const secretName = name.split("/")[3];
        return [{ payload: { data: Buffer.from(`${secretName}-value`) } }];
      });

      await secretManager.loadSecrets();
      const result = secretManager.hasRequiredSecrets();

      expect(result).toBe(true);
    });
  });
});
