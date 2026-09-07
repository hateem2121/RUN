import { ok } from "neverthrow";
import { describe, expect, it } from "vitest";
import {
  executeHybridSearch,
  reciprocalRankFusion,
} from "../../../services/catalog/hybrid-search.js";

describe("Reciprocal Rank Fusion (reciprocalRankFusion)", () => {
  it("handles empty lists and empty rankings gracefully", () => {
    expect(reciprocalRankFusion([])).toEqual([]);
    expect(reciprocalRankFusion([[]])).toEqual([]);
    expect(reciprocalRankFusion([[], []])).toEqual([]);
  });

  it("ranks a single list and normalizes scores between 0 and 1", () => {
    const list = [{ id: 101 }, { id: 102 }, { id: 103 }];
    const fused = reciprocalRankFusion([list], 60);

    expect(fused).toHaveLength(3);
    expect(fused[0]?.id).toBe(101);
    expect(fused[1]?.id).toBe(102);
    expect(fused[2]?.id).toBe(103);

    // Highest rank must have normalized score of 1.0
    expect(fused[0]?.rrfScore).toBe(1);

    // All scores must be strictly between 0 and 1
    for (const item of fused) {
      expect(item.rrfScore).toBeGreaterThanOrEqual(0);
      expect(item.rrfScore).toBeLessThanOrEqual(1);
    }

    // Monotonically decreasing
    expect(fused[0]?.rrfScore).toBeGreaterThan(fused[1]?.rrfScore ?? 0);
    expect(fused[1]?.rrfScore).toBeGreaterThan(fused[2]?.rrfScore ?? 0);
  });

  it("boosts documents appearing in multiple ranking lists", () => {
    // List 1 (e.g. Keyword): [doc1, doc2]
    // List 2 (e.g. Semantic): [doc2, doc3]
    // doc2 appears in both lists (rank 2 in list 1, rank 1 in list 2)
    // raw doc2: 1/(60+2) + 1/(60+1) = 1/62 + 1/61 =~ 0.03252
    // raw doc1: 1/(60+1) = 1/61 =~ 0.01639
    // raw doc3: 1/(60+2) = 1/62 =~ 0.01613
    const list1 = [{ id: 1 }, { id: 2 }];
    const list2 = [{ id: 2 }, { id: 3 }];

    const fused = reciprocalRankFusion([list1, list2], 60);

    expect(fused).toHaveLength(3);
    expect(fused[0]?.id).toBe(2);
    expect(fused[0]?.rrfScore).toBe(1); // Normalized top score

    expect(fused[1]?.id).toBe(1);
    expect(fused[2]?.id).toBe(3);

    expect(fused[1]?.rrfScore).toBeGreaterThan(fused[2]?.rrfScore ?? 0);
  });

  it("respects custom k smoothing parameter", () => {
    const list1 = [{ id: 1 }];
    const list2 = [{ id: 2 }];

    const fusedK10 = reciprocalRankFusion([list1, list2], 10);
    expect(fusedK10).toHaveLength(2);
    // When both are rank 1 in their respective lists, raw scores are identical: 1/(10+1) = 1/11
    // Ties are broken by ascending ID
    expect(fusedK10[0]?.id).toBe(1);
    expect(fusedK10[0]?.rrfScore).toBe(1);
    expect(fusedK10[1]?.id).toBe(2);
    expect(fusedK10[1]?.rrfScore).toBe(1);
  });

  it("deduplicates documents within the same list using best rank", () => {
    // doc1 appears twice in list1; best rank (rank 1) should be retained
    const listWithDupes = [{ id: 1 }, { id: 2 }, { id: 1 }];
    const fused = reciprocalRankFusion([listWithDupes], 60);

    expect(fused).toHaveLength(2);
    expect(fused[0]?.id).toBe(1);
    expect(fused[1]?.id).toBe(2);
  });

  it("sorts pre-scored items descending before computing ranks", () => {
    const scoredList = [
      { id: 10, score: 0.4 },
      { id: 20, score: 0.95 },
      { id: 30, score: 0.8 },
    ];

    const fused = reciprocalRankFusion([scoredList], 60);

    expect(fused[0]?.id).toBe(20); // highest score (0.95) -> rank 1
    expect(fused[1]?.id).toBe(30); // score 0.80 -> rank 2
    expect(fused[2]?.id).toBe(10); // score 0.40 -> rank 3
    expect(fused[0]?.rrfScore).toBe(1);
  });
});

describe("Hybrid Search (executeHybridSearch)", () => {
  it("returns empty results when query is empty or whitespace", async () => {
    const emptyRes = await executeHybridSearch("");
    expect(emptyRes).toEqual({ productIds: [], scores: {} });

    const whitespaceRes = await executeHybridSearch("   ");
    expect(whitespaceRes).toEqual({ productIds: [], scores: {} });
  });

  it("merges full-text search and semantic search with reciprocal rank fusion", async () => {
    const mockSearchProducts = async () => [{ id: 10 }, { id: 20 }, { id: 30 }];

    const mockSemanticSearch = async () => [
      { id: 20, score: 0.9 },
      { id: 40, score: 0.85 },
      { id: 10, score: 0.7 },
    ];

    const result = await executeHybridSearch(
      "running jacket",
      { limit: 10 },
      {
        searchProductsFn: mockSearchProducts,
        semanticSearchFn: mockSemanticSearch,
      },
    );

    expect(result.productIds).toBeDefined();
    expect(result.scores).toBeDefined();

    // ID 20 is rank 2 in full-text and rank 1 in semantic -> top fused result
    expect(result.productIds[0]).toBe(20);
    expect(result.scores[20]).toBe(1);

    // ID 10 is rank 1 in full-text and rank 3 in semantic -> second
    expect(result.productIds[1]).toBe(10);
    expect(result.scores[10]).toBeLessThan(1);
    expect(result.scores[10]).toBeGreaterThan(0);

    // All returned IDs have corresponding scores
    for (const id of result.productIds) {
      expect(result.scores[id]).toBeDefined();
      expect(result.scores[id]).toBeGreaterThanOrEqual(0);
      expect(result.scores[id]).toBeLessThanOrEqual(1);
    }
  });

  it("handles ResultAsync return from semantic search", async () => {
    const mockSearchProducts = async () => [{ id: 100 }];
    const mockSemanticSearch = async () =>
      ok({
        query: "tech hoodie",
        totalResults: 1,
        results: [
          {
            id: 200,
            name: "Tech Hoodie",
            slug: "tech-hoodie",
            type: "product" as const,
            similarityScore: 0.92,
            matchPercentage: 92,
            categoryName: "Apparel",
            description: null,
            technicalSummary: null,
          },
        ],
      });

    const result = await executeHybridSearch(
      "tech hoodie",
      {},
      {
        searchProductsFn: mockSearchProducts,
        semanticSearchFn: mockSemanticSearch,
      },
    );

    expect(result.productIds).toEqual([100, 200]);
    expect(result.scores[100]).toBe(1);
    expect(result.scores[200]).toBe(1);
  });

  it("applies offset and limit pagination correctly", async () => {
    const mockSearchProducts = async () => [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

    const result = await executeHybridSearch(
      "shorts",
      { limit: 2, offset: 1 },
      {
        searchProductsFn: mockSearchProducts,
        semanticSearchFn: async () => [],
      },
    );

    expect(result.productIds).toHaveLength(2);
    expect(result.productIds).toEqual([2, 3]);
    expect(Object.keys(result.scores)).toHaveLength(2);
  });

  it("survives and provides partial results when one search provider fails", async () => {
    const mockFailingFullText = async () => {
      throw new Error("Database timeout");
    };

    const mockSemanticSearch = async () => [{ id: 99, score: 0.9 }];

    const result = await executeHybridSearch(
      "recovery",
      {},
      {
        searchProductsFn: mockFailingFullText,
        semanticSearchFn: mockSemanticSearch,
      },
    );

    expect(result.productIds).toEqual([99]);
    expect(result.scores[99]).toBe(1);
  });
});
