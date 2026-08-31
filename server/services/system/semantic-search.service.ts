import type {
  SemanticSearchQuery,
  SemanticSearchResponseData,
  SemanticSearchResultItem,
} from "@run-remix/shared";
import { sql } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "../../db.js";
import { type AppError, InternalError } from "../../lib/errors.js";
import { generateEmbedding } from "./embedding.service.js";

interface RawProductMatch {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category_name: string | null;
  similarity: number;
}

interface RawFabricMatch {
  id: number;
  name: string;
  description: string | null;
  fabric_type: string | null;
  similarity: number;
}

/**
 * Executes a semantic vector similarity search across products and fabrics
 */
export function executeSemanticSearch(
  query: SemanticSearchQuery,
): ResultAsync<SemanticSearchResponseData, AppError> {
  const queryVector = generateEmbedding(query.q);
  const vectorStr = `[${queryVector.join(",")}]`;
  const limit = query.limit ?? 10;
  const threshold = query.threshold ?? 0.2;

  const searchPromises: Promise<SemanticSearchResultItem[]>[] = [];

  // 1. Search Products if requested
  if (query.type === "all" || query.type === "products") {
    const productPromise = db
      .execute(
        sql`
        SELECT 
          p.id, 
          p.name, 
          p.slug, 
          p.description,
          c.name AS category_name,
          (1 - (p.embedding <=> ${vectorStr}::vector)) AS similarity
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.embedding IS NOT NULL 
          AND p.is_active = true 
          AND p.deleted_at IS NULL
          AND (1 - (p.embedding <=> ${vectorStr}::vector)) >= ${threshold}
        ORDER BY p.embedding <=> ${vectorStr}::vector ASC
        LIMIT ${limit};
      `,
      )
      .then((res) => {
        const rows = res.rows as unknown as RawProductMatch[];
        return rows.map((r) => {
          const sim = Math.max(0, Math.min(1, Number(r.similarity)));
          return {
            id: Number(r.id),
            name: String(r.name),
            slug: String(r.slug),
            type: "product" as const,
            description: r.description ? String(r.description) : null,
            similarityScore: Number(sim.toFixed(4)),
            matchPercentage: Number((sim * 100).toFixed(1)),
            categoryName: r.category_name ? String(r.category_name) : null,
            technicalSummary: null,
          };
        });
      });

    searchPromises.push(productPromise);
  }

  // 2. Search Fabrics if requested
  if (query.type === "all" || query.type === "fabrics") {
    const fabricPromise = db
      .execute(
        sql`
        SELECT 
          f.id, 
          f.name, 
          f.description,
          f.fabric_type,
          (1 - (f.embedding <=> ${vectorStr}::vector)) AS similarity
        FROM fabrics f
        WHERE f.embedding IS NOT NULL 
          AND f.is_active = true 
          AND f.deleted_at IS NULL
          AND (1 - (f.embedding <=> ${vectorStr}::vector)) >= ${threshold}
        ORDER BY f.embedding <=> ${vectorStr}::vector ASC
        LIMIT ${limit};
      `,
      )
      .then((res) => {
        const rows = res.rows as unknown as RawFabricMatch[];
        return rows.map((r) => {
          const sim = Math.max(0, Math.min(1, Number(r.similarity)));
          return {
            id: Number(r.id),
            name: String(r.name),
            slug: `fabric-${r.id}`,
            type: "fabric" as const,
            description: r.description ? String(r.description) : null,
            similarityScore: Number(sim.toFixed(4)),
            matchPercentage: Number((sim * 100).toFixed(1)),
            categoryName: r.fabric_type ? String(r.fabric_type) : "Technical Fabric",
            technicalSummary: null,
          };
        });
      });

    searchPromises.push(fabricPromise);
  }

  return ResultAsync.fromPromise(
    Promise.all(searchPromises).then((results) => {
      const combined = results.flat();
      combined.sort((a, b) => b.similarityScore - a.similarityScore);
      const finalResults = combined.slice(0, limit);

      return {
        query: query.q,
        totalResults: finalResults.length,
        results: finalResults,
      };
    }),
    (err) => new InternalError("Failed to execute semantic vector search", { error: String(err) }),
  );
}
