import type { Request } from "express";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { verifyCloudTaskToken } from "../verify-cloud-task-token.js";

// vi.hoisted() runs before mock factories AND before static imports, so this
// shared vi.fn() is guaranteed to exist when the factory below executes.
// Every `new OAuth2Client()` — including the module-level instance created at
// import time in verify-cloud-task-token.ts — will reference the same function.
const { mockVerifyIdTokenFn } = vi.hoisted(() => ({
  mockVerifyIdTokenFn: vi.fn(),
}));

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(
    class {
      verifyIdToken = mockVerifyIdTokenFn;
    },
  ),
}));

describe("verifyCloudTaskToken", () => {
  let mockRequest: Partial<Request>;
  let mockVerifyIdToken: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLOUD_TASKS_AUDIENCE = "https://run-remix-worker-url.com";
    process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL = "worker@run-project.iam.gserviceaccount.com";

    mockRequest = {
      header: vi.fn().mockReturnValue("Bearer valid-token-string"),
    };

    // All instances (including the module-level one) share mockVerifyIdTokenFn
    mockVerifyIdToken = mockVerifyIdTokenFn as unknown as Mock;
  });

  it("should fail if Authorization header is missing", async () => {
    mockRequest.header = vi.fn().mockReturnValue(undefined);
    const result = await verifyCloudTaskToken(mockRequest as Request);
    expect(result).toBe(false);
  });

  it("should fail if Authorization header is not Bearer", async () => {
    mockRequest.header = vi.fn().mockReturnValue("Basic foo:bar");
    const result = await verifyCloudTaskToken(mockRequest as Request);
    expect(result).toBe(false);
  });

  it("should fail if environment variables are missing", async () => {
    delete process.env.CLOUD_TASKS_AUDIENCE;
    const result = await verifyCloudTaskToken(mockRequest as Request);
    expect(result).toBe(false);
  });

  it("should successfully verify a valid token", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: "worker@run-project.iam.gserviceaccount.com",
        iss: "https://accounts.google.com",
        aud: "https://run-remix-worker-url.com",
      }),
    });

    const result = await verifyCloudTaskToken(mockRequest as Request);

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "valid-token-string",
      audience: "https://run-remix-worker-url.com",
    });
    expect(result).toBe(true);
  });

  it("should fail if the token was signed by unexpected service account", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: "malicious-actor@another-project.iam.gserviceaccount.com",
        iss: "https://accounts.google.com",
      }),
    });

    const result = await verifyCloudTaskToken(mockRequest as Request);
    expect(result).toBe(false);
  });

  it("should fail if verifyIdToken throws an error", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Token expired"));
    const result = await verifyCloudTaskToken(mockRequest as Request);
    expect(result).toBe(false);
  });
});
