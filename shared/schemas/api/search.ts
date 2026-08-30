import { z } from "zod";

export const SemanticSearchQuerySchema = z.object({
  q: z.string().min(1, "Search query cannot be empty").max(300),
  category: z.string().optional(),
  type: z.enum(["all", "products", "fabrics"]).default("all"),
  limit: z.coerce.number().min(1).max(50).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.3),
});

export type SemanticSearchQuery = z.infer<typeof SemanticSearchQuerySchema>;

export const SemanticSearchResultItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(["product", "fabric"]),
  description: z.string().nullish(),
  similarityScore: z.number().min(0).max(1),
  matchPercentage: z.number().min(0).max(100),
  categoryName: z.string().nullish(),
  technicalSummary: z.string().nullish(),
});

export type SemanticSearchResultItem = z.infer<typeof SemanticSearchResultItemSchema>;

export const SemanticSearchResponseDataSchema = z.object({
  query: z.string(),
  totalResults: z.number(),
  results: z.array(SemanticSearchResultItemSchema),
});

export type SemanticSearchResponseData = z.infer<typeof SemanticSearchResponseDataSchema>;
