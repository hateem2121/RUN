import { Router } from "express";
import { insertLegalPolicySchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { legalService } from "../../services/legal.service.js";

const router = Router();

// GET /api/legal-policies - Get a legal policy by slug or list active policies
router.get("/legal-policies", async (req, res) => {
  const slug = req.query.slug as string | undefined;

  if (slug) {
    const result = await legalService.getLegalPolicyBySlug(slug, false);
    return result.match(
      (data) => {
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.json(data);
      },
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  }

  const result = await legalService.getLegalPolicies(false);
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// GET /api/legal-policies/admin - List all policies for administration
router.get("/legal-policies/admin", authService.requireAdmin, async (_req, res) => {
  const result = await legalService.getLegalPolicies(true);
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// GET /api/legal-policies/:id - Get a policy by ID
router.get("/legal-policies/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError("Invalid policy ID");
  }

  const result = await legalService.getLegalPolicy(id);
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// POST /api/legal-policies - Create new policy
router.post("/legal-policies", authService.requireAdmin, async (req, res) => {
  const validation = insertLegalPolicySchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid policy data", { issues: validation.error.issues });
  }

  const result = await legalService.createLegalPolicy(removeUndefined(validation.data));
  return result.match(
    (data) => res.status(201).json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PUT /api/legal-policies/:id - Update policy
router.put("/legal-policies/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError("Invalid policy ID");
  }

  const validation = insertLegalPolicySchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid policy data", { issues: validation.error.issues });
  }

  const result = await legalService.updateLegalPolicy(id, removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// DELETE /api/legal-policies/:id - Delete policy
router.delete("/legal-policies/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError("Invalid policy ID");
  }

  const result = await legalService.deleteLegalPolicy(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
