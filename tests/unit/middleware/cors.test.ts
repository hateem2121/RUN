import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCorsMiddleware } from "../../../server/boot/middleware.js";

describe("CORS Middleware (CORS-01)", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  function createMockRes() {
    const headers: Record<string, string> = {};
    let statusCode: number | undefined;
    const res = {
      setHeader: vi.fn((key: string, value: string) => {
        headers[key.toLowerCase()] = value;
        return res;
      }),
      getHeader: vi.fn((key: string) => headers[key.toLowerCase()]),
      sendStatus: vi.fn((code: number) => {
        statusCode = code;
        return res;
      }),
      headers,
      getStatusCode: () => statusCode,
    };
    return res as unknown as Response & {
      headers: Record<string, string>;
      getStatusCode: () => number | undefined;
    };
  }

  it("should permit origin http://localhost:5002 in development", () => {
    const cors = createCorsMiddleware();
    const req = {
      headers: { origin: "http://localhost:5002" },
      method: "GET",
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "http://localhost:5002",
    );
    expect(next).toHaveBeenCalled();
  });

  it("should permit origin http://127.0.0.1:5002 in development", () => {
    const cors = createCorsMiddleware();
    const req = {
      headers: { origin: "http://127.0.0.1:5002" },
      method: "GET",
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "http://127.0.0.1:5002",
    );
    expect(next).toHaveBeenCalled();
  });

  it("should REJECT legacy port 3000 in development", () => {
    const cors = createCorsMiddleware();
    const req = {
      headers: { origin: "http://localhost:3000" },
      method: "GET",
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "http://localhost:3000",
    );
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("should REJECT legacy port 5173 in development", () => {
    const cors = createCorsMiddleware();
    const req = {
      headers: { origin: "http://localhost:5173" },
      method: "GET",
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "http://localhost:5173",
    );
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("should set wildcard * in development when origin is omitted", () => {
    const cors = createCorsMiddleware();
    const req = {
      headers: {},
      method: "GET",
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(next).toHaveBeenCalled();
  });

  it("should answer OPTIONS preflight requests with 200 without calling next", () => {
    const cors = createCorsMiddleware();
    const req = {
      headers: { origin: "http://localhost:5002" },
      method: "OPTIONS",
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("should set standard CORS headers", () => {
    const cors = createCorsMiddleware();
    const req = {
      headers: { origin: "http://localhost:5002" },
      method: "GET",
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-csrf-token",
    );
    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Credentials", "true");
  });
});
