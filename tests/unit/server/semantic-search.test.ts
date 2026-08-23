import { describe, expect, it } from "vitest";
import {
  calculateCosineSimilarity,
  generateEmbedding,
} from "../../../server/services/embedding.service.js";

describe("Embedding Service & Vector Similarity", () => {
  it("generates normalized 384-dimensional embedding vector", () => {
    const vec = generateEmbedding("breathable moisture-wicking soccer jersey");
    expect(vec).toHaveLength(384);

    // Euclidean Norm should be ~ 1.0
    const sumSq = vec.reduce((sum, v) => sum + v * v, 0);
    const norm = Math.sqrt(sumSq);
    expect(norm).toBeCloseTo(1.0, 2);
  });

  it("produces identical deterministic embeddings for identical text", () => {
    const text = "EcoTech 100% Organic Cotton Interlock Fabric";
    const vec1 = generateEmbedding(text);
    const vec2 = generateEmbedding(text);
    expect(vec1).toEqual(vec2);
  });

  it("computes cosine similarity accurately", () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];

    expect(calculateCosineSimilarity(v1, v2)).toBeCloseTo(1.0, 4);
    expect(calculateCosineSimilarity(v1, v3)).toBeCloseTo(0.0, 4);
  });

  it("yields higher semantic similarity for related athletic concepts", () => {
    const query = generateEmbedding("lightweight summer running shirt");
    const docAero = generateEmbedding("AeroWeave lightweight breathable running match kit");
    const docHeavy = generateEmbedding("Heavy insulated waterproof winter expedition jacket");

    const simAero = calculateCosineSimilarity(query, docAero);
    const simHeavy = calculateCosineSimilarity(query, docHeavy);

    expect(simAero).toBeGreaterThan(simHeavy);
  });
});
