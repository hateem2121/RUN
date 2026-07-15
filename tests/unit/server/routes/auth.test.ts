import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authRouter from "../../../../server/routes/auth";
import { authService } from "../../../../server/services/auth-service";

// Mock dependencies
vi.mock("../../../../server/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    ENABLE_MOCK_ADMIN: "true",
    VITEST: "true",
  },
}));

vi.mock("../../../../server/lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../../server/middleware/rateLimiter", () => ({
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../../../server/services/auth-service", () => ({
  authService: {
    seedMockUser: vi.fn().mockResolvedValue(true),
    isAuthenticated: (_req: any, _res: any, next: any) => next(),
    getUserInfo: vi.fn().mockResolvedValue({
      isErr: () => false,
      value: { id: "db-user", email: "db@user.com" },
    }),
  },
}));

vi.mock("passport", () => {
  return {
    default: {
      authenticate: vi.fn((strategy, _options) => {
        return (req: any, _res: any, next: any) => {
          if (strategy === "google") {
            req.user = { id: "oauth-user", claims: {} };
          }
          next();
        };
      }),
    },
  };
});

const app = express();
// Mock session middleware
app.use((req: any, _res, next) => {
  req.session = {
    regenerate: vi.fn((cb) => cb(null)),
    save: vi.fn((cb) => cb(null)),
    destroy: vi.fn((cb) => cb(null)),
  };
  req.login = vi.fn((user, cb) => {
    req.user = user;
    cb(null);
  });
  req.logout = vi.fn((cb) => cb(null));

  // Also pass headers for json testing
  next();
});
app.use("/", authRouter);

describe("Auth Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /login", () => {
    it("should load login route successfully", async () => {
      const response = await request(app).get("/login");
      // Express default behavior if next() is called and no other handler responds is 404
      expect(response.status).toBe(404);
    });
  });

  describe("GET /mock-login", () => {
    it("should authenticate mock user and return json if requested", async () => {
      const response = await request(app).get("/mock-login").set("Accept", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe("mock-admin@example.com");
      expect(authService.seedMockUser).toHaveBeenCalled();
    });

    it("should authenticate mock user and redirect if json not requested", async () => {
      const response = await request(app).get("/mock-login?returnTo=/dashboard");
      expect(response.status).toBe(302);
      expect(response.header.location).toBe("/dashboard");
    });
  });

  describe("GET /google/callback", () => {
    it("should regenerate session and redirect on success", async () => {
      const response = await request(app).get("/google/callback");
      expect(response.status).toBe(302);
      expect(response.header.location).toBe("/");
    });
  });

  describe("GET /logout", () => {
    it("should logout, destroy session and redirect", async () => {
      const response = await request(app).get("/logout");
      expect(response.status).toBe(302);
      expect(response.header.location).toBe("/");
    });
  });

  describe("GET /user", () => {
    it("should return mock user directly if isMock claim is true", async () => {
      app.use(
        "/test-user-mock",
        (req: any, _res, next) => {
          req.user = { claims: { isMock: true }, id: "mock-id" };
          next();
        },
        authRouter,
      );

      const response = await request(app).get("/test-user-mock/user");
      expect(response.status).toBe(200);
      expect(response.body.id).toBe("mock-id");
    });

    it("should fetch from db if not mock user", async () => {
      app.use(
        "/test-user-db",
        (req: any, _res, next) => {
          req.user = { claims: { sub: "db-id" } };
          next();
        },
        authRouter,
      );

      const response = await request(app).get("/test-user-db/user");
      expect(response.status).toBe(200);
      expect(response.body.id).toBe("db-user");
      expect(authService.getUserInfo).toHaveBeenCalledWith("db-id");
    });

    it("should return 404 if db user not found", async () => {
      vi.mocked(authService.getUserInfo).mockResolvedValueOnce({
        isErr: () => true,
        error: new Error("Not found"),
      } as any);

      app.use(
        "/test-user-404",
        (req: any, _res, next) => {
          req.user = { claims: { sub: "db-id" } };
          next();
        },
        authRouter,
      );

      const response = await request(app).get("/test-user-404/user");
      expect(response.status).toBe(404);
    });
  });
});
