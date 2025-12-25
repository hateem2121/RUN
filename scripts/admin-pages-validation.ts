#!/usr/bin/env tsx

// @ts-nocheck

/**
 * Admin Pages Validation Script for RUN APPAREL (PVT) LTD
 * Tests that admin interface components work with actual database schema
 * Identifies schema mismatches between frontend and backend
 */

import fetch from "node-fetch";
import { db } from "../server/db.js";

async function validateAdminPages() {
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const issues: string[] = [];

  const dbChecks = [
    { name: "Homepage Hero", query: () => db.query.homepageHero.findMany() },
    {
      name: "Homepage Slogans",
      query: () => db.query.homepageSlogans.findMany(),
    },
    {
      name: "Homepage Process Cards",
      query: () => db.query.homepageProcessCards.findMany(),
    },
    {
      name: "Homepage Sections",
      query: () => db.query.homepageSections.findMany(),
    },
    {
      name: "Homepage Sustainability",
      query: () => db.query.homepageSustainability.findMany(),
    },
    {
      name: "Homepage Featured Products Settings",
      query: () => db.query.homepageFeaturedProductsSettings.findMany(),
    },
    { name: "About Hero", query: () => db.query.aboutHero.findMany() },
    {
      name: "About Timeline",
      query: () => db.query.aboutTimelineEntries.findMany(),
    },
    {
      name: "About Locations",
      query: () => db.query.aboutMapLocations.findMany(),
    },
    {
      name: "About Statistics",
      query: () => db.query.aboutStatistics.findMany(),
    },
    {
      name: "Sustainability Hero",
      query: () => db.query.sustainabilityHero.findMany(),
    },
    {
      name: "Sustainability Metrics",
      query: () => db.query.sustainabilityMetrics.findMany(),
    },
    {
      name: "Manufacturing Processes",
      query: () => db.query.manufacturingProcesses.findMany(),
    },
    {
      name: "Technology Innovations",
      query: () => db.query.technologyInnovations.findMany(),
    },
  ];

  for (const check of dbChecks) {
    try {
      const data = await check.query();
      if (data && data.length > 0) {
        passedChecks++;
      } else {
        issues.push(`${check.name}: No seeded data found`);
        failedChecks++;
      }
      totalChecks++;
    } catch (_error) {
      issues.push(`${check.name}: Database query failed`);
      failedChecks++;
      totalChecks++;
    }
  }

  const apiEndpoints = [
    "/api/homepage-hero",
    "/api/homepage-slogans",
    "/api/homepage-process-cards",
    "/api/homepage-sections",
    "/api/homepage-sustainability",
    "/api/about-hero",
    "/api/about-timeline",
    "/api/about-locations",
    "/api/about-statistics",
    "/api/sustainability-hero",
    "/api/sustainability-metrics",
    "/api/manufacturing-processes",
    "/api/technology-innovations",
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`);
      if (response.ok) {
        const _data = await response.json();
        passedChecks++;
      } else {
        issues.push(`${endpoint}: API endpoint failed (${response.status})`);
        failedChecks++;
      }
      totalChecks++;
    } catch (_error) {
      issues.push(`${endpoint}: Network/connection error`);
      failedChecks++;
      totalChecks++;
    }
  }

  try {
    // Check Homepage Sustainability structure
    const sustainabilityData = await db.query.homepageSustainability.findFirst();
    if (sustainabilityData) {
      // Check if metrics field is properly formatted
      if (sustainabilityData.metrics && typeof sustainabilityData.metrics === "object") {
        passedChecks++;
      } else {
        issues.push(`Homepage Sustainability: Metrics field structure issue`);
        failedChecks++;
      }
      totalChecks++;
    }

    // Check Featured Products Settings structure
    const featuredProductsData = await db.query.homepageFeaturedProductsSettings.findFirst();
    if (featuredProductsData) {
      passedChecks++;
    } else {
      issues.push(`Homepage Featured Products: No settings record found`);
      failedChecks++;
    }
    totalChecks++;
  } catch (error) {
    issues.push(`Schema validation failed: ${error.message}`);
    failedChecks++;
    totalChecks++;
  }

  const adminRoutes = [
    "/admin",
    "/admin/homepage",
    "/admin/about",
    "/admin/sustainability",
    "/admin/manufacturing",
    "/admin/technology",
  ];

  for (const route of adminRoutes) {
    try {
      const response = await fetch(`http://localhost:5000${route}`);
      if (response.ok) {
        const html = await response.text();
        if (html.includes("<!DOCTYPE html") && html.includes("<script")) {
          passedChecks++;
        } else {
          issues.push(`${route}: Route serves content but may not be fully functional`);
          failedChecks++;
        }
      } else {
        issues.push(`${route}: Admin route not accessible`);
        failedChecks++;
      }
      totalChecks++;
    } catch (_error) {
      issues.push(`${route}: Admin route connection failed`);
      failedChecks++;
      totalChecks++;
    }
  }

  // Issues Report
  if (issues.length > 0) {
    issues.forEach((_issue, _index) => {});
  }
  if (failedChecks === 0) {
  } else if (failedChecks <= totalChecks * 0.2) {
  } else {
  }

  return {
    totalChecks,
    passedChecks,
    failedChecks,
    successRate: ((passedChecks / totalChecks) * 100).toFixed(1),
    issues,
  };
}

// Execute validation
validateAdminPages()
  .then((results) => {
    if (results.issues.length > 0) {
    }
    process.exit(results.failedChecks > 0 ? 1 : 0);
  })
  .catch((_error) => {
    process.exit(1);
  });
