/**
 * MASTER RESOURCE ROUTER INDEX
 *
 * Central hub for all modular resource routers
 * Imports and mounts all resource routes with consistent /api/* paths
 *
 * Architecture Pattern: Master Router Pattern
 * - Each resource has its own dedicated router file
 * - All routers are mounted here with RESTful paths
 * - Maintains flat API structure with clear resource boundaries
 *
 * Route Structure:
 * - /api/homepage-*       - Homepage page resources
 * - /api/contact*         - Contact page resources
 * - /api/about-*          - About page resources
 * - /api/sustainability-* - Sustainability page resources
 * - /api/manufacturing-*  - Manufacturing page resources
 * - /api/technology-*     - Technology page resources
 */

import { Router } from "express";
// About Page Resources
import aboutHeroRouter from "./about-hero.routes.js";
import aboutLocationsRouter from "./about-locations.routes.js";
import aboutSectionsRouter from "./about-sections.routes.js";
import aboutStatisticsRouter from "./about-statistics.routes.js";
import aboutTeamMessageRouter from "./about-team-message.routes.js";
import aboutTimelineRouter from "./about-timeline.routes.js";
// Contact Page Resources (relocated from modules/ on October 15, 2025)
import contactRouter from "./contact.routes.js";
// Homepage Page Resources (relocated from modules/ on October 15, 2025)
import homepageBatchRouter from "./homepage-batch.routes.js";
import homepageManagementRouter from "./homepage-management.routes.js";
import logoSettingsRouter from "./logo-settings.routes.js";
import manufacturingCapabilitiesRouter from "./manufacturing-capabilities.routes.js";
import manufacturingCaseStudiesRouter from "./manufacturing-case-studies.routes.js";
import manufacturingHeroRouter from "./manufacturing-hero.routes.js";
// Manufacturing Page Resources
import manufacturingProcessesRouter from "./manufacturing-processes.routes.js";
import manufacturingQualitiesRouter from "./manufacturing-qualities.routes.js";

import navigationRouter from "./navigation.routes.js";
import pageContentRouter from "./page-content-routes.js";
import resourceBatchRouter from "./resource-batch.routes.js";
import sustainabilityRouter from "./sustainability.routes.js";
// Sustainability Page Resources
import sustainabilityBatchRouter from "./sustainability-batch.routes.js";
import sustainabilityGoalsRouter from "./sustainability-goals.routes.js";
import sustainabilityInitiativesRouter from "./sustainability-initiatives.routes.js";
import sustainabilityMetricsRouter from "./sustainability-metrics.routes.js";
import technologyCTARouter from "./technology-cta.routes.js";
import technologyEquipmentRouter from "./technology-equipment.routes.js";
import technologyGradientSettingsRouter from "./technology-gradient-settings.routes.js";
// Technology Page Resources
import technologyInnovationsRouter from "./technology-innovations.routes.js";
import technologyResearchRouter from "./technology-research.routes.js";
import technologyRoadmapRouter from "./technology-roadmap.routes.js";

const router = Router();

// ============================================================================
// HOMEPAGE PAGE RESOURCES (relocated from modules/ on October 15, 2025)
// ============================================================================
router.use("/", homepageBatchRouter); // Mounts /homepage-batch, /cache/health, /performance-monitoring
router.use("/", homepageManagementRouter); // Mounts /homepage-hero, /homepage-slogans, etc.

// ============================================================================
// CONTACT PAGE RESOURCES (relocated from modules/ on October 15, 2025)
// ============================================================================
router.use("/", contactRouter); // Mounts /contact, /contact-info, /locations

// ============================================================================
// ABOUT PAGE RESOURCES
// ============================================================================
router.use("/about-hero", aboutHeroRouter);
router.use("/about-timeline", aboutTimelineRouter);
router.use("/about-locations", aboutLocationsRouter);
router.use("/about-sections", aboutSectionsRouter);
router.use("/about-statistics", aboutStatisticsRouter);
router.use("/about-team-message", aboutTeamMessageRouter);

// ============================================================================
// ABOUT & TECHNOLOGY BATCH ROUTES (PUBLIC - from page-content-routes)
// ============================================================================
router.use(pageContentRouter); // Mounts /about-batch, /technology-batch, /sustainability-hero, /technology-hero
router.use("/resources", resourceBatchRouter); // Mounts /resources/batch (aggregated Certs, Accessories, etc.)

// ============================================================================
// SUSTAINABILITY PAGE RESOURCES
// ============================================================================
router.use("/sustainability/batch", sustainabilityBatchRouter); // Must be before /sustainability to match /batch
router.use("/sustainability", sustainabilityRouter);
router.use("/sustainability-metrics", sustainabilityMetricsRouter);
router.use("/sustainability-initiatives", sustainabilityInitiativesRouter);
router.use("/sustainability-goals", sustainabilityGoalsRouter);

// ============================================================================
// MANUFACTURING PAGE RESOURCES
// ============================================================================
router.use("/manufacturing-processes", manufacturingProcessesRouter);
router.use("/manufacturing-capabilities", manufacturingCapabilitiesRouter);
router.use("/manufacturing-qualities", manufacturingQualitiesRouter);
router.use("/manufacturing-case-studies", manufacturingCaseStudiesRouter);

// ============================================================================
// TECHNOLOGY PAGE RESOURCES
// ============================================================================
router.use("/technology-innovations", technologyInnovationsRouter);
router.use("/technology-equipment", technologyEquipmentRouter);
router.use("/technology-research", technologyResearchRouter);
router.use("/technology-roadmap", technologyRoadmapRouter);
router.use("/technology-cta", technologyCTARouter);
router.use("/technology-gradient-settings", technologyGradientSettingsRouter);

// Manufacturing Hero (Relocated from page-content-routes.ts)
router.use("/", manufacturingHeroRouter); // Mounts /manufacturing-hero

// ============================================================================
// NAVIGATION RESOURCES
// ============================================================================
router.use("/", navigationRouter); // Mounts /navigation-items, /navigation-settings
router.use("/", logoSettingsRouter); // Mounts /logo-animation-settings

export default router;
