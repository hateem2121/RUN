import type { Request } from "express";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { verifyCloudTaskToken } from "../verify-cloud-task-token.js";

// Mock google-auth-library
vi.mock("google-auth-library", () => {
  const MockOAuth2Client = vi.fn().mockImplementation(() => ({
    verifyIdToken: vi.fn(),
  }));
  return { OAuth2Client: MockOAuth2Client };
});

import { OAuth2Client } from "google-auth-library";

describe("verifyCloudTaskToken", () => {
  let mockRequest: Partial<Request>;
  let mockVerifyIdToken: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLOUD_TASKS_AUDIENCE = "https://run-remix-worker-url.com";
    process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL = "worker@run-project.iam.gserviceaccount.com";

    // Setup basic mock request
    mockRequest = {
      header: vi.fn().mockReturnValue("Bearer valid-token-string"),
    };

    // Get the mocked instance method
    const mockClientInstance = new OAuth2Client();
    mockVerifyIdToken = mockClientInstance.verifyIdToken as unknown as Mock;
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
