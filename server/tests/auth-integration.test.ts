import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerRoutes } from "../routes/index.js";

// Mocking dependencies to avoid actual DB/External calls
vi.mock("../services/auth-service.js", () => ({
  authService: {
    setup: vi.fn(),
    isAuthenticated: (req: any, res: any, next: any) => {
      if (req.headers.authorization === "good") {
        return next();
      }
      res.status(401).json({ message: "Unauthorized" });
    },
    requireAdmin: (req: any, res: any, next: any) => {
      if (req.headers.authorization === "admin") {
        return next();
      }
      res.status(403).json({ message: "Forbidden" });
    },
  },
}));

vi.mock("../lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: () => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }),
    TTL_PRESETS: {
      SHORT: 300,
      MEDIUM: 1800,
      LONG: 3600,
      MEDIA: 21600,
      STATIC: 86400,
    },
  },
}));

vi.mock("../lib/openapi-generator.js", () => ({
  registry: {
    registerPath: vi.fn(),
    registerComponent: vi.fn(),
    register: vi.fn(),
    definitions: [],
  },
  jsonResponse: vi.fn().mockReturnValue({}),
  generateOpenApiSpec: vi.fn().mockReturnValue({
    openapi: "3.0.0",
    info: { title: "Test", version: "1.0.0" },
    paths: {},
  }),
}));

vi.mock("../lib/storage-singleton.js", () => ({
  getStorage: () => ({
    getProducts: vi.fn().mockResolvedValue([]),
    getProductsCount: vi.fn().mockResolvedValue(0),
  }),
}));

describe("Auth Integration Flow", () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it("should block unauthorized access to protected routes", async () => {
    const response = await request(app).get("/api/admin/cache/stats");
    expect(response.status).toBe(403);
  });

  it("should allow admin access with proper credentials (mocked)", async () => {
    const response = await request(app)
      .post("/api/admin/cache/clear")
      .set("Authorization", "admin")
      .send({ userId: "1" });

    // Status depends on the individual handler implementation, but we check if it passed middleware
    expect(response.status).not.toBe(403);
    expect(response.status).not.toBe(401);
  });

  it("should return 401 for unauthenticated public routes requiring login", async () => {
    const response = await request(app).get("/api/auth/user");
    expect(response.status).toBe(401);
  });
});
