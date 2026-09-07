import type { SemanticSearchResponseData } from "@run-remix/shared";
import type { ResultAsync } from "neverthrow";
import type { AppError } from "../../lib/errors.js";
import { productRepository } from "../repositories/index.js";
import { executeSemanticSearch } from "../system/semantic-search.service.js";

export interface RankedItem {
  id: number;
  score?: number;
}

export interface FusedRankItem {
  id: number;
  rrfScore: number;
}

export interface HybridSearchOptions {
  categoryId?: number;
  limit?: number;
  offset?: number;
}

export interface HybridSearchResult {
  productIds: number[];
  scores: Record<number, number>;
}

export interface HybridSearchDependencies {
  searchProductsFn?: (
    query: string,
    filters: { categoryId?: number; isActive?: boolean; isFeatured?: boolean },
    limit: number,
    offset: number,
  ) => Promise<Array<{ id: number }>>;
  semanticSearchFn?: (params: {
    q: string;
    type: "all" | "products" | "fabrics";
    category?: string;
    limit: number;
    threshold: number;
  }) =>
    | Promise<Array<{ id: number; score?: number }>>
    | ResultAsync<SemanticSearchResponseData, AppError>;
}

/**
 * Computes Reciprocal Rank Fusion (RRF) across multiple ranked lists.
 * Formula: RRF_Score(doc) = sum_{list i} (1 / (k + rank_{i}(doc)))
 *
 * Normalizes fused scores between 0 and 1 (relative to highest observed score).
 * Output is sorted in descending order of rrfScore.
 *
 * @param rankings Array of ranked lists of items
 * @param k Smoothing constant (default = 60)
 */
export function reciprocalRankFusion(
  rankings: Array<Array<RankedItem>>,
  k = 60,
): Array<FusedRankItem> {
  if (!rankings || rankings.length === 0) {
    return [];
  }

  const rawScores = new Map<number, number>();

  for (const list of rankings) {
    if (!list || list.length === 0) continue;

    // If scores are provided, sort list descending by score before computing 1-based ranks
    const sorted = [...list].sort((a, b) => {
      if (typeof a.score === "number" && typeof b.score === "number") {
        return b.score - a.score;
      }
      return 0;
    });

    const seenInList = new Set<number>();

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (!item || typeof item.id !== "number" || Number.isNaN(item.id)) continue;

      // Ensure doc is only counted once per list (using its highest rank)
      if (seenInList.has(item.id)) continue;
      seenInList.add(item.id);

      const rank = i + 1; // 1-based rank
      const currentScore = rawScores.get(item.id) ?? 0;
      rawScores.set(item.id, currentScore + 1 / (k + rank));
    }
  }

  if (rawScores.size === 0) {
    return [];
  }

  let maxScore = 0;
  for (const score of rawScores.values()) {
    if (score > maxScore) {
      maxScore = score;
    }
  }

  const fused: FusedRankItem[] = [];
  for (const [id, rawScore] of rawScores.entries()) {
    const normalizedScore = maxScore > 0 ? Number((rawScore / maxScore).toFixed(6)) : 0;
    fused.push({ id, rrfScore: normalizedScore });
  }

  // Sort by fused score descending, breaking ties by ascending ID
  fused.sort((a, b) => {
    if (b.rrfScore !== a.rrfScore) {
      return b.rrfScore - a.rrfScore;
    }
    return a.id - b.id;
  });

  return fused;
}

/**
 * Executes a hybrid search combining full-text keyword search and vector semantic search
 * with Reciprocal Rank Fusion.
 *
 * @param query Search query text
 * @param options Pagination and category filter options
 * @param deps Optional dependency overrides for testing
 */
export async function executeHybridSearch(
  query: string,
  options: HybridSearchOptions = {},
  deps: HybridSearchDependencies = {},
): Promise<HybridSearchResult> {
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    return { productIds: [], scores: {} };
  }

  const limit = Math.max(1, options.limit ?? 20);
  const offset = Math.max(0, options.offset ?? 0);
  const fetchLimit = limit + offset;

  // Build filters conforming to exactOptionalPropertyTypes
  const filters: { categoryId?: number; isActive?: boolean; isFeatured?: boolean } = {
    isActive: true,
  };
  if (options.categoryId !== undefined) {
    filters.categoryId = options.categoryId;
  }

  // 1. Full-Text Search (List 1)
  const fullTextPromise = (async (): Promise<RankedItem[]> => {
    try {
      if (deps.searchProductsFn) {
        const results = await deps.searchProductsFn(trimmed, filters, fetchLimit, 0);
        return results.map((p) => ({ id: p.id }));
      }

      const results = await productRepository.searchProducts(trimmed, filters, fetchLimit, 0);
      return (results ?? []).map((p) => ({ id: p.id }));
    } catch {
      return [];
    }
  })();

  // 2. Semantic / Attribute Search (List 2)
  const semanticParams: {
    q: string;
    type: "products";
    category?: string;
    limit: number;
    threshold: number;
  } = {
    q: trimmed,
    type: "products",
    limit: fetchLimit,
    threshold: 0.2,
  };
  if (options.categoryId !== undefined) {
    semanticParams.category = String(options.categoryId);
  }

  const semanticPromise = (async (): Promise<RankedItem[]> => {
    try {
      if (deps.semanticSearchFn) {
        const res = await deps.semanticSearchFn(semanticParams);

        if (Array.isArray(res)) {
          return res;
        }

        if (res && "isOk" in res && typeof res.isOk === "function") {
          if (res.isOk()) {
            return (res.value.results ?? [])
              .filter((r) => r.type === "product")
              .map((r) => ({ id: r.id, score: r.similarityScore }));
          }
          return [];
        }
      }

      const semanticRes = await executeSemanticSearch(semanticParams);

      return semanticRes.match(
        (data) => {
          return (data.results ?? [])
            .filter((r) => r.type === "product")
            .map((r) => ({ id: r.id, score: r.similarityScore }));
        },
        () => [],
      );
    } catch {
      return [];
    }
  })();

  const [fullTextList, semanticList] = await Promise.all([fullTextPromise, semanticPromise]);

  // Reciprocal Rank Fusion of list 1 and list 2
  const fused = reciprocalRankFusion([fullTextList, semanticList], 60);

  // Apply offset and limit
  const paged = fused.slice(offset, offset + limit);

  const productIds = paged.map((item) => item.id);
  const scores: Record<number, number> = {};
  for (const item of paged) {
    scores[item.id] = item.rrfScore;
  }

  return { productIds, scores };
}
