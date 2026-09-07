import { ADMIN_SUPER, CATALOG_READ, CATALOG_WRITE, ORDERS_READ } from "@run-remix/shared";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requirePermission } from "../../../server/middleware/rbac.js";

describe("RBAC Middleware - requirePermission (RBAC-01)", () => {
  beforeEach(() => {
    delete process.env.BYPASS_RBAC_FOR_TESTING;
  });

  function createMockRes() {
    let statusCode = 200;
    let jsonBody: unknown;
    const res = {
      status: vi.fn((code: number) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((body: unknown) => {
        jsonBody = body;
        return res;
      }),
      getStatusCode: () => statusCode,
      getJson: () => jsonBody,
    };
    return res as unknown as Response & {
      getStatusCode: () => number;
      getJson: () => unknown;
    };
  }

  it("should return 401 when request is not authenticated", () => {
    const middleware = requirePermission(CATALOG_READ);
    const req = {
      isAuthenticated: () => false,
      user: undefined,
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow request when user has exact required permission bitmask", () => {
    const middleware = requirePermission(CATALOG_READ);
    const req = {
      isAuthenticated: () => true,
      user: {
        id: "user-1",
        permissionBitmask: CATALOG_READ,
      },
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 403 when user bitmask lacks required permission", () => {
    const middleware = requirePermission(CATALOG_WRITE);
    const req = {
      isAuthenticated: () => true,
      user: {
        id: "user-1",
        permissionBitmask: CATALOG_READ, // only has read
      },
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow request when user has ADMIN_SUPER", () => {
    const middleware = requirePermission(CATALOG_WRITE, ORDERS_READ);
    const req = {
      isAuthenticated: () => true,
      user: {
        id: "admin-1",
        permissionBitmask: ADMIN_SUPER,
      },
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should resolve permission bitmask from user.isAdmin when bitmask is not explicitly provided", () => {
    const middleware = requirePermission(CATALOG_WRITE);
    const req = {
      isAuthenticated: () => true,
      user: {
        id: "admin-2",
        isAdmin: true,
      },
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
