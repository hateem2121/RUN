import { SemanticSearchQuerySchema } from "@run-remix/shared";
import { type Request, type Response, Router } from "express";
import { apiTier } from "../../middleware/rate-limit-tiers.js";
import { executeSemanticSearch } from "../../services/semantic-search.service.js";

const router = Router();
router.use(apiTier);

/**
 * GET /api/search/semantic
 * Natural language semantic vector search across products and technical fabrics
 */
router.get("/search/semantic", async (req: Request, res: Response) => {
  const parsed = SemanticSearchQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid search query parameters",
      details: parsed.error.format(),
    });
  }

  const result = await executeSemanticSearch(parsed.data);

  return result.match(
    (data) => res.json({ success: true, data }),
    (err) =>
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message,
      }),
  );
});

export default router;
