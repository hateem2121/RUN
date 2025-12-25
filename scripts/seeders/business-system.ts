/**
 * BUSINESS & SYSTEM SEEDER
 * Seeds inquiries, audit logs, performance metrics, and system tables
 */

import { db } from "../../server/db.js";
import {
  animationErrors,
  auditConfiguration,
  auditLogs,
  inquiries,
  performanceMetrics,
  storageAnalysisResults,
  storageChangeLogs,
} from "../../shared/schema.js";
import { type SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";

/**
 * Seed sample inquiries
 */
export async function seedInquiries(): Promise<SeedResult> {
  return seedWithTransaction("inquiries", async () => {
    const inquiryData = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        company: "ABC Sports Inc",
        phone: "+1-555-0123",
        message: "Interested in ordering 500 custom team jerseys. Can you provide a quote?",
        platform: "Email",
        status: "pending",
        createdAt: new Date("2024-11-20T10:00:00Z"),
      },
      {
        name: "Sarah Mitchell",
        email: "sarah.m@corporatefit.com",
        company: "Corporate Fit Solutions",
        phone: "+1-555-0456",
        message:
          "Looking for corporate polo shirts for 200 employees. Need information on customization options.",
        platform: "Phone Call",
        status: "in_progress",
        createdAt: new Date("2024-11-19T14:30:00Z"),
      },
      {
        name: "Michael Chen",
        email: "m.chen@athleticpro.com",
        company: "Athletic Pro",
        phone: "+1-555-0789",
        message: "Request samples of performance fabrics and pricing for bulk order.",
        platform: "WhatsApp",
        status: "completed",
        createdAt: new Date("2024-11-18T09:15:00Z"),
      },
    ];

    return await db.insert(inquiries).values(inquiryData).returning();
  });
}

/**
 * Seed audit configuration
 */
export async function seedAuditConfiguration(): Promise<SeedResult> {
  return seedWithTransaction("auditConfiguration", async () => {
    const auditConfig = {
      enableAuditLogs: true,
      retentionDays: 90,
      logLevel: "info",
      auditedTables: ["products", "categories", "users", "orders"],
      isActive: true,
    };

    return await db.insert(auditConfiguration).values(auditConfig).returning();
  });
}

/**
 * Seed sample audit logs
 */
export async function seedAuditLogs(): Promise<SeedResult> {
  return seedWithTransaction("auditLogs", async () => {
    const auditData = [
      {
        tableName: "products",
        action: "UPDATE",
        recordId: "1",
        userId: "1",
        changes: { basePrice: { old: "11.99", new: "12.99" } },
        timestamp: new Date("2024-11-20T10:30:00Z"),
      },
      {
        tableName: "categories",
        action: "CREATE",
        recordId: "5",
        userId: "1",
        changes: { name: "New Category", slug: "new-category" },
        timestamp: new Date("2024-11-19T15:00:00Z"),
      },
      {
        tableName: "products",
        action: "UPDATE",
        recordId: "2",
        userId: "1",
        changes: { isActive: { old: false, new: true } },
        timestamp: new Date("2024-11-18T11:00:00Z"),
      },
    ];

    return await db.insert(auditLogs).values(auditData).returning();
  });
}

/**
 * Seed performance metrics
 */
export async function seedPerformanceMetrics(): Promise<SeedResult> {
  return seedWithTransaction("performanceMetrics", async () => {
    const metricsData = [
      {
        value: "1.2",
        unit: "seconds",
        metricType: "page_load_time",
        componentName: "/products",
        timestamp: new Date("2024-11-20T10:00:00Z"),
      },
      {
        value: "0.15",
        unit: "seconds",
        metricType: "api_response_time",
        componentName: "/api/products",
        timestamp: new Date("2024-11-20T10:05:00Z"),
      },
      {
        value: "0.05",
        unit: "seconds",
        metricType: "database_query_time",
        componentName: "product_query",
        timestamp: new Date("2024-11-20T10:10:00Z"),
      },
      {
        value: "0.8",
        unit: "seconds",
        metricType: "page_load_time",
        componentName: "/homepage",
        timestamp: new Date("2024-11-20T11:00:00Z"),
      },
      {
        value: "0.3",
        unit: "seconds",
        metricType: "media_load_time",
        componentName: "image_optimization",
        timestamp: new Date("2024-11-20T11:15:00Z"),
      },
    ];

    return await db.insert(performanceMetrics).values(metricsData).returning();
  });
}

/**
 * Seed storage analysis results
 */
export async function seedStorageAnalysisResults(): Promise<SeedResult> {
  return seedWithTransaction("storageAnalysisResults", async () => {
    const storageData = [
      {
        version: "1.0",
        timestamp: new Date("2024-11-20T00:00:00Z").toISOString(),
        totalFiles: 250,
        totalSize: 1250000000,
        referencedFiles: 240,
        orphanedCount: 10,
        duplicateCount: 5,
        breakdown: {
          images: { count: 180, size: "900000000" },
          videos: { count: 15, size: "300000000" },
          documents: { count: 55, size: "50000000" },
        },
        duplicateGroups: 5,
        compressionCandidates: 30,
        analysisTime: 15000,
      },
    ];

    return await db.insert(storageAnalysisResults).values(storageData).returning();
  });
}

/**
 * Seed storage change logs
 */
export async function seedStorageChangeLogs(): Promise<SeedResult> {
  return seedWithTransaction("storageChangeLogs", async () => {
    const changeLogData = [
      {
        filename: "product-image-001.jpg",
        action: "upload",
        timestamp: new Date("2024-11-20T09:00:00Z").toISOString(),
        mediaId: 1,
        size: 2500000,
      },
      {
        filename: "old-banner.jpg",
        action: "delete",
        timestamp: new Date("2024-11-19T16:00:00Z").toISOString(),
        mediaId: 2,
        size: 5000000,
      },
      {
        filename: "hero-image.jpg",
        action: "update",
        timestamp: new Date("2024-11-18T12:00:00Z").toISOString(),
        mediaId: 3,
        size: 3000000,
      },
    ];

    return await db.insert(storageChangeLogs).values(changeLogData).returning();
  });
}

/**
 * Seed animation errors (for debugging UI animations)
 */
export async function seedAnimationErrors(): Promise<SeedResult> {
  return seedWithTransaction("animationErrors", async () => {
    const errorData = [
      {
        errorType: "logo",
        message: "Animation frame dropped",
        component: "NavbarLogo",
        timestamp: new Date("2024-11-20T10:30:00Z"),
        severity: "warning",
      },
      {
        errorType: "page_transition",
        message: "Transition delay exceeded threshold",
        component: "PageTransition",
        timestamp: new Date("2024-11-19T14:00:00Z"),
        severity: "error",
      },
    ];

    return await db.insert(animationErrors).values(errorData).returning();
  });
}

// Export all seeders
export const businessSystemSeeders = {
  seedInquiries,
  seedAuditConfiguration,
  seedAuditLogs,
  seedPerformanceMetrics,
  seedStorageAnalysisResults,
  seedStorageChangeLogs,
  seedAnimationErrors,
};
