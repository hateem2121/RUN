import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../../server/lib/errors";
import { shouldBypassCache } from "../../../../../server/lib/utilities/core-utils";
import navigationRouter from "../../../../../server/routes/resources/navigation.routes";
import { NavigationService } from "../../../../../server/services/navigation-service";

vi.mock("@run-remix/shared", () => ({
  insertNavigationItemSchema: {
    safeParse: vi.fn((data) => {
      if (!data.label && !data.id) return { success: false, error: { issues: [] } };
      if (data.isVisible === "yes") return { success: false, error: { issues: [] } };
      return { success: true, data };
    }),
    partial: () => ({
      safeParse: vi.fn((data) => {
        if (data.isVisible === "yes") return { success: false, error: { issues: [] } };
        return { success: true, data };
      }),
    }),
  },
  navigationReorderSchema: {
    safeParse: vi.fn((data) => {
      if (!Array.isArray(data.items)) return { success: false, error: { issues: [] } };
      return { success: true, data };
    }),
  },
  insertNavigationGlassmorphismSettingsSchema: {
    safeParse: vi.fn((data) => {
      if (data.blur > 50) return { success: false, error: { issues: [] } };
      return { success: true, data };
    }),
  },
}));

vi.mock("../../../../../server/services/navigation-service", () => ({
  NavigationService: {
    getItems: vi.fn(),
    getGlassmorphismSettings: vi.fn(),
    createItem: vi.fn(),
    reorderItems: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    updateGlassmorphismSettings: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/auth-service", () => ({
  authService: {
    requireAdmin: vi.fn((_req, _res, next) => next()),
  },
}));

vi.mock("../../../../../server/lib/utilities/core-utils", () => ({
  shouldBypassCache: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/", navigationRouter);
// Global error handler for the test app
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message, issues: err.issues });
  }
  return res.status(500).json({ error: err.message });
});

describe("Navigation Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /navigation-items", () => {
    it("should return items with cache headers when cache is hit", async () => {
      vi.mocked(shouldBypassCache).mockReturnValue(false);
      vi.mocked(NavigationService.getItems).mockResolvedValue(
        ok({
          data: [{ id: 1, label: "Home" }],
          metadata: { ttl: 300, cacheHit: true, responseTime: 5 },
        }),
      );

      const response = await request(app).get("/navigation-items");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, label: "Home" }]);
      expect(response.header["cache-control"]).toBe("public, max-age=300");
      expect(response.header["x-cache-hit"]).toBe("true");
      expect(response.header["x-response-time"]).toBe("5");
    });

    it("should return no-cache headers when ttl is 0", async () => {
      vi.mocked(shouldBypassCache).mockReturnValue(true);
      vi.mocked(NavigationService.getItems).mockResolvedValue(
        ok({
          data: [],
          metadata: { ttl: 0, cacheHit: false, responseTime: 2 },
        }),
      );

      const response = await request(app).get("/navigation-items");

      expect(response.status).toBe(200);
      expect(response.header["cache-control"]).toBe("no-cache, max-age=0");
      expect(response.header["x-admin-request"]).toBe("true");
    });

    it("should propagate service errors", async () => {
      vi.mocked(shouldBypassCache).mockReturnValue(false);
      const testError = new AppError("Service failed", 500);
      vi.mocked(NavigationService.getItems).mockResolvedValue(err(testError));

      const response = await request(app).get("/navigation-items");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Service failed" });
    });
  });

  describe("GET /navigation-settings", () => {
    it("should return settings and set response time header", async () => {
      vi.mocked(NavigationService.getGlassmorphismSettings).mockResolvedValue(
        ok({
          enabled: true,
          blur: 10,
        }),
      );

      const response = await request(app).get("/navigation-settings");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ enabled: true, blur: 10 });
      expect(response.header).toHaveProperty("x-response-time");
    });

    it("should return 500 on service error", async () => {
      vi.mocked(NavigationService.getGlassmorphismSettings).mockResolvedValue(
        err(new AppError("DB error")),
      );

      const response = await request(app).get("/navigation-settings");

      expect(response.status).toBe(500);
    });
  });

  describe("POST /admin/navigation-items", () => {
    it("should validate and create item", async () => {
      const payload = { label: "About", path: "/about", sortOrder: 1, isVisible: true };
      vi.mocked(NavigationService.createItem).mockResolvedValue(ok({ id: 1, ...payload }));

      const response = await request(app).post("/admin/navigation-items").send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id", 1);
      expect(NavigationService.createItem).toHaveBeenCalledWith(expect.objectContaining(payload));
    });

    it("should return 400 on validation error", async () => {
      const response = await request(app).post("/admin/navigation-items").send({ label: "" }); // missing path

      expect(response.status).toBe(422);
      expect(response.body.error).toContain("Invalid navigation item");
    });

    it("should handle service error", async () => {
      const payload = { label: "About", path: "/about", sortOrder: 1, isVisible: true };
      vi.mocked(NavigationService.createItem).mockResolvedValue(
        err(new AppError("Create failed", 409)),
      );

      const response = await request(app).post("/admin/navigation-items").send(payload);

      expect(response.status).toBe(409);
    });
  });

  describe("PATCH /admin/navigation-items/reorder", () => {
    it("should reorder items", async () => {
      const payload = {
        items: [
          { id: 1, sortOrder: 2 },
          { id: 2, sortOrder: 1 },
        ],
      };
      vi.mocked(NavigationService.reorderItems).mockResolvedValue(ok({ success: true }));

      const response = await request(app).patch("/admin/navigation-items/reorder").send(payload);

      expect(response.status).toBe(200);
      expect(NavigationService.reorderItems).toHaveBeenCalledWith(payload.items);
    });

    it("should return 400 on invalid items array", async () => {
      const response = await request(app)
        .patch("/admin/navigation-items/reorder")
        .send({ items: "not-an-array" });
      expect(response.status).toBe(422);
    });
  });

  describe("PATCH /admin/navigation-items/:id", () => {
    it("should update item", async () => {
      const payload = { label: "Updated" };
      vi.mocked(NavigationService.updateItem).mockResolvedValue(
        ok({ id: 1, label: "Updated", path: "/about" }),
      );

      const response = await request(app).patch("/admin/navigation-items/1").send(payload);

      expect(response.status).toBe(200);
      expect(NavigationService.updateItem).toHaveBeenCalledWith(
        1,
        expect.objectContaining(payload),
      );
    });

    it("should return 400 on invalid update data", async () => {
      const response = await request(app)
        .patch("/admin/navigation-items/1")
        .send({ isVisible: "yes" }); // boolean expected
      expect(response.status).toBe(422);
    });
  });

  describe("DELETE /admin/navigation-items/:id", () => {
    it("should delete item", async () => {
      vi.mocked(NavigationService.deleteItem).mockResolvedValue(ok(undefined));

      const response = await request(app).delete("/admin/navigation-items/1");

      expect(response.status).toBe(204);
      expect(NavigationService.deleteItem).toHaveBeenCalledWith(1);
    });

    it("should handle delete error", async () => {
      vi.mocked(NavigationService.deleteItem).mockResolvedValue(
        err(new AppError("Not found", 404)),
      );

      const response = await request(app).delete("/admin/navigation-items/1");

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /admin/navigation-glassmorphism-settings", () => {
    it("should update settings", async () => {
      const payload = { enabled: false, blur: 5, transparency: 0.5 };
      vi.mocked(NavigationService.updateGlassmorphismSettings).mockResolvedValue(ok(payload));

      const response = await request(app)
        .patch("/admin/navigation-glassmorphism-settings")
        .send(payload);

      expect(response.status).toBe(200);
      expect(NavigationService.updateGlassmorphismSettings).toHaveBeenCalledWith(payload);
    });

    it("should return 400 on validation error", async () => {
      const response = await request(app)
        .patch("/admin/navigation-glassmorphism-settings")
        .send({ blur: 100 }); // exceeding max
      expect(response.status).toBe(422);
    });
  });
});
