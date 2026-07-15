import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnv } from "../../../../shared/schemas/env.schema.js";

describe("env.schema validation", () => {
  let originalExit: typeof process.exit;
  let originalError: typeof console.error;
  let originalWarn: typeof console.warn;
  let mockExit: any;

  beforeEach(() => {
    originalExit = process.exit;
    originalError = console.error;
    originalWarn = console.warn;

    mockExit = vi.fn(() => {
      throw new Error("process.exit called");
    }) as any;
    process.exit = mockExit;
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    process.exit = originalExit;
    console.error = originalError;
    console.warn = originalWarn;
    vi.clearAllMocks();
  });

  const getValidEnv = () => ({
    NODE_ENV: "production",
    PORT: "5002",
    DATABASE_URL: "postgres://user:pass@host/db",
    SESSION_SECRET: "12345678901234567890123456789012345678901234567890",
    ENCRYPTION_KEY: "12345678901234567890123456789012",
    INITIAL_ADMIN_EMAIL: "admin@example.com",
    CLOUD_TASKS_AUDIENCE: "audience",
    CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL: "service@example.com",
    // Adding VITEST check override to test the production checks
    VITEST: "false",
  });

  it("should call process.exit(1) on invalid basic configuration", () => {
    expect(() => validateEnv({ INVALID: "true" })).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalled();
  });

  it("should call process.exit(1) if ENABLE_MOCK_ADMIN is true in production", () => {
    expect(() =>
      validateEnv({
        ...getValidEnv(),
        ENABLE_MOCK_ADMIN: "true",
      }),
    ).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should call process.exit(1) if BYPASS_RBAC_FOR_TESTING is true in production", () => {
    expect(() =>
      validateEnv({
        ...getValidEnv(),
        BYPASS_RBAC_FOR_TESTING: "true",
      }),
    ).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should call process.exit(1) if CLOUD_TASKS configurations are missing in production", () => {
    const invalidEnv = getValidEnv();
    delete (invalidEnv as any).CLOUD_TASKS_AUDIENCE;

    expect(() => validateEnv(invalidEnv)).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should call console.warn if SESSION_SECRET is too short in production", () => {
    validateEnv({
      ...getValidEnv(),
      SESSION_SECRET: "12345678901234567890123456789012", // 32 chars, but < 48
    });
    expect(console.warn).toHaveBeenCalledWith(
      "⚠️ SESSION_SECRET is shorter than recommended (48+) for production.",
    );
    expect(mockExit).not.toHaveBeenCalled();
  });
});
