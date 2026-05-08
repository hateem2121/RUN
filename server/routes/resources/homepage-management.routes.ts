import { Router } from "express";
import {
  insertHomepageFeaturedProductsSettingsSchema,
  insertHomepageHeroSchema,
  insertHomepageProcessCardSchema,
  insertHomepageSectionSchema,
  insertHomepageSloganSchema,
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
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.patch("/homepage-hero", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageHeroSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid hero data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateHero(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

// ================================
// HOMEPAGE SLOGANS ROUTES
// ================================

router.get("/homepage-slogans", async (req, res) => {
  const result = await homepageService.getSlogans();
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.get("/homepage-slogans/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await homepageService.getSlogan(id);
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.post("/homepage-slogans", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageSloganSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid slogan data", { issues: validation.error.issues });
  }

  const result = await homepageService.createSlogan(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/homepage-slogans/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = insertHomepageSloganSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid slogan data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateSlogan(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/homepage-slogans/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await homepageService.deleteSlogan(id);
  if (result.isErr()) throw result.error;

  return res.status(204).send();
});

router.patch("/homepage-slogans/reorder", authService.requireAdmin, async (req, res) => {
  const { slogans } = req.body;
  if (!Array.isArray(slogans)) {
    throw new ValidationError("Slogans must be an array of IDs");
  }

  const result = await homepageService.reorderSlogans(slogans);
  if (result.isErr()) throw result.error;

  return res.json({ success: true });
});

// ================================
// HOMEPAGE PROCESS CARDS ROUTES
// ================================

router.get("/homepage-process-cards/admin", async (req, res) => {
  const result = await homepageService.getProcessCards(true);
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.get("/homepage-process-cards", async (_req, res) => {
  const result = await homepageService.getProcessCards(false);
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.get("/homepage-process-cards/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await homepageService.getProcessCard(id);
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.post("/homepage-process-cards", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageProcessCardSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid process card data", { issues: validation.error.issues });
  }

  const result = await homepageService.createProcessCard(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/homepage-process-cards/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = insertHomepageProcessCardSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid process card data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateProcessCard(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/homepage-process-cards/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await homepageService.deleteProcessCard(id);
  if (result.isErr()) throw result.error;

  return res.status(204).send();
});

router.patch("/homepage-process-cards/reorder", authService.requireAdmin, async (req, res) => {
  const { cards } = req.body;
  if (!Array.isArray(cards)) {
    throw new ValidationError("Cards must be an array of IDs");
  }

  const result = await homepageService.reorderProcessCards(cards);
  if (result.isErr()) throw result.error;

  return res.json({ success: true });
});

// ================================
// HOMEPAGE SECTIONS ROUTES
// ================================

router.get("/homepage-sections", async (req, res) => {
  const result = await homepageService.getSections(shouldBypassCache(req));
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.get("/homepage-sections/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await homepageService.getSectionById(id);
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.patch("/homepage-sections/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = insertHomepageSectionSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid section data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateSectionById(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

// ================================
// HOMEPAGE FEATURED PRODUCTS SETTINGS ROUTES
// ================================

router.get("/homepage-featured-products-settings", async (req, res) => {
  const result = await homepageService.getFeaturedProductsSettings();
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

router.patch("/homepage-featured-products-settings", authService.requireAdmin, async (req, res) => {
  const validation = insertHomepageFeaturedProductsSettingsSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid settings data", { issues: validation.error.issues });
  }

  const result = await homepageService.updateFeaturedProductsSettings(
    removeUndefined(validation.data),
  );
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

export default router;
