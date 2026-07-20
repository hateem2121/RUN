import { Router } from "express";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { miscService } from "../../services/misc.service.js";

const router = Router();

// FIBERS ROUTES
router.get("/fibers", async (_req, res) => {
  const result = await miscService.getFibers();
  return result.match(
    (fibers) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json(fibers);
    },
    (error) => res.status(error.statusCode || 500).json({ message: error.message }),
  );
});

router.post("/fibers", authService.requireAdmin, async (req, res) => {
  const result = await miscService.createFiber(removeUndefined(req.body) as any);

  return result.match(
    (fiber) => res.status(201).json(fiber),
    (error) => res.status(error.statusCode || 500).json({ message: error.message }),
  );
});

router.put("/fibers/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fiber");
  if (id === null) return;

  const result = await miscService.updateFiber(id, removeUndefined(req.body));

  return result.match(
    (fiber) => res.json(fiber),
    (error) => res.status(error.statusCode || 500).json({ message: error.message }),
  );
});

router.delete("/fibers/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fiber");
  if (id === null) return;

  const result = await miscService.deleteFiber(id);

  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ message: error.message }),
  );
});

export default router;
