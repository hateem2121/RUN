import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { productionErrorHandler } from "../../../server/middleware/production-error-handler";

// Mock config to ensure consistent environment
vi.mock("../../../server/config/production.js", () => ({
  getConfig: () => ({
    app: { environment: "production", enableDebugMode: false },
    monitoring: { logLevel: "error" },
  }),
}));

// Mock logger to avoid cluttering test output
vi.mock("../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  correlationContext: {
    getStore: () => "req-123",
  },
}));

// Mock error aggregator
vi.mock("../../../server/lib/monitoring/error-aggregator.js", () => ({
  errorAggregator: {
    recordError: vi.fn(),
  },
}));

describe("RFC 7807 Compliance", () => {
  it("should generate a standard problem details object for 404", () => {
    // We'll test the internal logic via the exported function (we'll need to export generateErrorResponse or test via middleware)
    // Since generateErrorResponse is not exported in the original file, we might need to rely on the middleware integration test
    // or temporarily export it. For now, let's test the middleware exhaustively.

    const req = {
      path: "/api/unknown",
      method: "GET",
      ip: "127.0.0.1",
      get: () => "TestAgent",
      header: () => "params",
    } as unknown as Request;

    // Create chainable mock response object
    const jsonMock = vi.fn();
    const setHeaderMock = vi.fn().mockReturnValue({ json: jsonMock });
    const statusMock = vi.fn().mockReturnValue({ setHeader: setHeaderMock, json: jsonMock });

    const res = {
      headersSent: false,
      setHeader: setHeaderMock,
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    const next = vi.fn();
    const error = { status: 404, message: "Not Found" };

    productionErrorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);

    // Verify RFC 9457 Content-Type
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/problem+json");

    const jsonCall = vi.mocked(res.json).mock.calls[0][0];

    // Standard RFC 7807 fields
    expect(jsonCall).toHaveProperty("type");
    expect(jsonCall).toHaveProperty("title");
    expect(jsonCall).toHaveProperty("status", 404);
    expect(jsonCall).toHaveProperty("detail");
    expect(jsonCall).toHaveProperty("instance");
  });
});
