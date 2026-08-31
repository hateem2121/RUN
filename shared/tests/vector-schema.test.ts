import { describe, expect, it } from "vitest";
import { fabrics, products, vector } from "../index.js";

describe("Vector Schema Definitions", () => {
  it("exports custom vector column type", () => {
    expect(vector).toBeDefined();
  });

  it("products schema exports embedding vector column", () => {
    expect(products.embedding).toBeDefined();
    expect(products.embedding.name).toBe("embedding");
  });

  it("fabrics schema exports embedding vector column", () => {
    expect(fabrics.embedding).toBeDefined();
    expect(fabrics.embedding.name).toBe("embedding");
  });
});
