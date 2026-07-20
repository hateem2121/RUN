import { Router } from "express";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { miscService } from "../../services/misc.service.js";

const router = Router();

// GET /api/fabrics - List all fabrics
router.get("/fabrics", async (_req, res) => {
  const result = await miscService.getFabrics();
  return result.match(
    (fabrics) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json(fabrics);
    },
    (error) =>
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: { message: error.message } }),
  );
});

// POST /api/fabrics - Create new fabric
router.post("/fabrics", authService.requireAdmin, async (req, res) => {
  const result = await miscService.createFabric(req.body);

  return result.match(
    (fabric) => res.status(201).json(fabric),
    (error) =>
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: { message: error.message } }),
  );
});

// PUT /api/fabrics/:id - Update fabric
router.put("/fabrics/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fabric");
  if (id === null) return;
  const result = await miscService.updateFabric(id, req.body);

  return result.match(
    (fabric) => res.json(fabric),
    (error) =>
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: { message: error.message } }),
  );
});

// PATCH /api/fabrics/:id - Partial update fabric
router.patch("/fabrics/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fabric");
  if (id === null) return;
  const result = await miscService.updateFabric(id, req.body);

  return result.match(
    (fabric) => res.json(fabric),
    (error) =>
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: { message: error.message } }),
  );
});

// DELETE /api/fabrics/:id - Delete fabric
router.delete("/fabrics/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fabric");
  if (id === null) return;
  const result = await miscService.deleteFabric(id);

  return result.match(
    () => res.status(204).send(),
    (error) =>
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: { message: error.message } }),
  );
});

export default router;
