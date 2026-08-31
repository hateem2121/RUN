import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/system/semantic-search.service.js", () => ({
  executeSemanticSearch: vi.fn(),
}));

import searchRouter from "../../../routes/core/search.js";
import { executeSemanticSearch } from "../../../services/system/semantic-search.service.js";

const app = express();
app.use(express.json());
app.use("/api", searchRouter);

describe("Core Semantic Search Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/search/semantic", () => {
    it("should return 400 when query parameter 'q' is missing", async () => {
      const response = await request(app).get("/api/search/semantic");
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid search query parameters");
    });

    it("should return 200 with search results on valid query", async () => {
      const mockData = {
        query: "breathable mesh",
        totalResults: 2,
        results: [
          {
            id: 118,
            name: "AeroWeave™ Technical Mesh",
            slug: "fabric-118",
            type: "fabric",
            description: "High-performance moisture-wicking mesh",
            similarityScore: 0.985,
            matchPercentage: 98.5,
            categoryName: "Technical Fabric",
            technicalSummary: null,
          },
        ],
      };

      vi.mocked(executeSemanticSearch).mockResolvedValue(ok(mockData) as any);

      const response = await request(app)
        .get("/api/search/semantic")
        .query({ q: "breathable mesh", type: "all", limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.query).toBe("breathable mesh");
      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.results[0].name).toBe("AeroWeave™ Technical Mesh");
      expect(response.body.data.results[0].matchPercentage).toBe(98.5);
    });

    it("should handle internal search errors with appropriate status", async () => {
      vi.mocked(executeSemanticSearch).mockResolvedValue(
        err({ statusCode: 500, message: "Database connection failed" }) as any,
      );

      const response = await request(app).get("/api/search/semantic").query({ q: "error test" });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Database connection failed");
    });
  });
});
