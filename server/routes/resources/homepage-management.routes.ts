import { Router } from "express";
import {
  insertHomepageFeaturedProductsSettingsSchema,
  insertHomepageHeroSchema,
  insertHomepageProcessCardSchema,
  insertHomepageSectionSchema,
  insertHomepageSloganSchema,
  processCardReorderSchema,
  sloganReorderSchema,
} from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { homepageService } from "../../services/homepage.service.js";

/**
 * HOMEPAGE MANAGEMENT RESOURCE ROUTER
 *
 * Page-specific CRUD operations for Homepage content.
 * Refactored to "Thin Controller" pattern: delegates business logic to homepageService.
 * Enforces RFC 9110/9457 compliance via native Express 5 error propagation.
 */
const router = Router();

// ================================
// HOMEPAGE HERO ROUTES
// ================================

router.get("/homepage-hero", async (req, res) => {
  const result = await homepageService.getHero(shouldBypassCache(req));
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/homepage-hero", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageHeroSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid hero data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateHero(removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// ================================
// HOMEPAGE SLOGANS ROUTES
// ================================

router.get("/homepage-slogans", async (_req, res) => {
  const result = await homepageService.getSlogans();
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/homepage-slogans/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await homepageService.getSlogan(id);
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post("/homepage-slogans", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageSloganSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid slogan data", { issues: validation.error.issues });
  }

  const result = await homepageService.createSlogan(removeUndefined(validation.data));
  return result.match(
    (data) => res.status(201).json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/homepage-slogans/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const validation = insertHomepageSloganSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid slogan data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateSlogan(id, removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.delete("/homepage-slogans/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await homepageService.deleteSlogan(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/homepage-slogans/reorder", authService.requireAdmin, async (req, res) => {
  const parsed = sloganReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Slogans must be an array of IDs", { issues: parsed.error.issues });
  }

  const result = await homepageService.reorderSlogans(parsed.data.slogans);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// ================================
// HOMEPAGE PROCESS CARDS ROUTES
// ================================

router.get("/homepage-process-cards/admin", async (_req, res) => {
  const result = await homepageService.getProcessCards(true);
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/homepage-process-cards", async (_req, res) => {
  const result = await homepageService.getProcessCards(false);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/homepage-process-cards/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await homepageService.getProcessCard(id);
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post("/homepage-process-cards", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageProcessCardSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid process card data", { issues: validation.error.issues });
  }

  const result = await homepageService.createProcessCard(removeUndefined(validation.data));
  return result.match(
    (data) => res.status(201).json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/homepage-process-cards/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const validation = insertHomepageProcessCardSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid process card data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateProcessCard(id, removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.delete("/homepage-process-cards/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await homepageService.deleteProcessCard(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/homepage-process-cards/reorder", authService.requireAdmin, async (req, res) => {
  const parsed = processCardReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Cards must be an array of IDs", { issues: parsed.error.issues });
  }

  const result = await homepageService.reorderProcessCards(parsed.data.cards);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// ================================
// HOMEPAGE SECTIONS ROUTES
// ================================

router.get("/homepage-sections", async (req, res) => {
  const result = await homepageService.getSections(shouldBypassCache(req));
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.get("/homepage-sections/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await homepageService.getSectionById(id);
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/homepage-sections/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const validation = insertHomepageSectionSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid section data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateSectionById(id, removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// ================================
// HOMEPAGE FEATURED PRODUCTS SETTINGS ROUTES
// ================================

router.get("/homepage-featured-products-settings", async (_req, res) => {
  const result = await homepageService.getFeaturedProductsSettings();
  return result.match(
    (data) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(data);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/homepage-featured-products-settings", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageFeaturedProductsSettingsSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid settings data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateFeaturedProductsSettings(
    removeUndefined(validation.data),
  );
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
