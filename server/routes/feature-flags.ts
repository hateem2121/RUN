import { Router } from "express";

const router = Router();

// GET /api/feature-flags
router.get("/", (_req, res) => {
  res.json({
    enableTechnologyBatchAPI: true,
    enableModularArchitecture: true,
    enableNewAdminUI: true,
    useModularTechnologyComponents: true,
  });
});

export default router;
