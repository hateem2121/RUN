import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { pgTable } from "./common";

/**
 * Performance Metrics Table - Frontend Performance Tracking
 *
 * @table performance_metrics
 * @description Stores Core Web Vitals and custom performance metrics
 * collected from frontend applications. Used for monitoring and optimization.
 *
 * @metrics Supported metric types include:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time To First Byte)
 * - Custom component-level metrics
 */
export const performanceMetrics = pgTable(
  "performance_metrics",
  {
    id: serial("id").primaryKey(),
    metricType: varchar({ length: 100 }).notNull(),
    componentName: varchar({ length: 255 }).notNull(),
    component: varchar({ length: 255 }), // Additional component field for compatibility
    value: decimal({ precision: 12, scale: 4 }).notNull(),
    unit: varchar({ length: 20 }).notNull(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    timestamp: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("metrics_type_time_idx").on(table.metricType, table.timestamp),
    index("metrics_component_idx").on(table.componentName),
    index("metrics_timestamp_idx").on(table.timestamp.desc()),
  ],
);

// Animation Errors
export const animationErrors = pgTable(
  "animation_errors",
  {
    id: serial("id").primaryKey(),
    errorType: varchar({ length: 100 }).notNull(),
    message: text().notNull(),
    stackTrace: text("stack_trace"),
    componentName: varchar({ length: 255 }),
    url: varchar({ length: 500 }),
    userAgent: varchar({ length: 500 }),
    retryCount: integer("retry_count").default(0),
    resolved: boolean().default(false),
    resolvedAt: timestamp("resolved_at", { mode: "date", precision: 3 }),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [
    index("anim_errors_type_resolved_idx").on(table.errorType, table.resolved),
    index("anim_errors_component_idx").on(table.componentName),
  ],
);

// Logo Animation Settings
export const logoAnimationSettings = pgTable("logo_animation_settings", {
  id: serial("id").primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  duration: integer().default(2000),
  delay: integer().default(0),
  easing: varchar({ length: 100 }).default("ease-out"),
  scale: decimal({ precision: 4, scale: 2 }).default("1.0"),
  rotation: integer().default(0),
  opacity: decimal({ precision: 3, scale: 2 }).default("1.0"),
  motionEnabled: boolean().default(true), // Enable/disable motion animations
  motionSpeed: decimal({ precision: 3, scale: 2 }), // Animation speed multiplier
  motionElements: jsonb().$type<string[]>(), // Elements with motion applied
  animationDurationMultiplier: decimal({
    precision: 3,
    scale: 2,
  }).default("1.0"), // Duration multiplier
  drawStagger: decimal({ precision: 4, scale: 2 }), // Stagger delay between elements
  drawEasing: varchar({ length: 100 }), // Draw animation easing
  skipButtonEnabled: boolean().default(false), // Show skip button
  showFrequency: boolean().default(false), // Show frequency indicator
  customCssClass: varchar({ length: 255 }), // Custom CSS class
  debugMode: boolean().default(false), // Debug mode for animation
  settings: jsonb().$type<Record<string, unknown>>(),
  isActive: boolean().default(true),
  createdAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Storage Analysis Results
export const storageAnalysisResults = pgTable("storage_analysis_results", {
  id: serial("id").primaryKey(),
  timestamp: varchar({ length: 50 }).notNull(),
  totalFiles: integer("total_files").notNull(),
  totalSize: integer("total_size").notNull(),
  referencedFiles: integer("referenced_files").notNull(),
  orphanedCount: integer("orphaned_count").notNull(),
  duplicateGroups: integer("duplicate_groups").notNull(),
  compressionCandidates: integer("compression_candidates").notNull(),
  potentialSavings: jsonb("potential_savings").$type<{
    orphanedSize: number;
    duplicateSize: number;
    compressionSize: number;
    totalSavings: number;
  }>(),
  analysisTime: integer("analysis_time").notNull(),
  version: varchar({ length: 50 }).notNull(),
  createdAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Storage Change Logs
export const storageChangeLogs = pgTable(
  "storage_change_logs",
  {
    id: serial("id").primaryKey(),
    timestamp: varchar({ length: 50 }).notNull(),
    action: varchar({ length: 20 }).notNull(),
    mediaId: integer("media_id").notNull(),
    filename: varchar({ length: 255 }).notNull(),
    size: integer(),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(),
  },
  (table) => [index("storage_logs_action_time_idx").on(table.action, table.createdAt)],
);

/**
 * Audit Logs Table - Comprehensive Change Tracking
 *
 * @table audit_logs
 * @description Enterprise-grade audit trail for all data mutations.
 * Tracks CREATE, UPDATE, DELETE, RESTORE, and SOFT_DELETE operations.
 *
 * @compliance
 * - Supports GDPR, CCPA, and SOX compliance requirements
 * - `complianceLevel` categorizes records (standard, high, critical)
 * - `retentionPeriod` defines days to retain (default: 7 years)
 *
 * @tracking Captures:
 * - User attribution (userId, email, role)
 * - Request context (IP, user agent, session)
 * - Change delta (oldValues, newValues, changedFields)
 *
 * @example
 * ```typescript
 * // Log a product update
 * await db.insert(auditLogs).values({
 *   action: 'UPDATE',
 *   tableName: 'products',
 *   recordId: productId.toString(),
 *   userId: req.user.id,
 *   oldValues: previousProduct,
 *   newValues: updatedProduct,
 *   changedFields: ['name', 'price'],
 * });
 * ```
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),

    // Action details
    action: varchar({ length: 50 }).notNull(), // CREATE, UPDATE, DELETE, RESTORE, SOFT_DELETE
    tableName: varchar({ length: 100 }).notNull(),
    recordId: varchar({ length: 50 }).notNull(), // String to support various ID types

    // Change tracking
    oldValues: jsonb().$type<Record<string, unknown>>(), // Previous state
    newValues: jsonb().$type<Record<string, unknown>>(), // New state
    changedFields: jsonb().$type<string[]>(), // List of modified fields

    // User attribution
    userId: varchar({ length: 100 }), // User who made the change
    userEmail: varchar({ length: 255 }), // Encrypted (AES-256-GCM)
    userEmailIndex: varchar({ length: 255 }), // Blind Index (HMAC-SHA256)
    userRole: varchar({ length: 50 }), // Role at time of change

    // Request context
    ipAddress: varchar({ length: 255 }), // Encrypted (expanded length for ciphertext)
    userAgent: text(), // Encrypted
    sessionId: varchar({ length: 255 }), // Session tracking

    // Additional metadata
    reason: text(), // Optional reason for change
    metadata: jsonb().$type<Record<string, unknown>>(), // Additional context

    // Timestamps
    timestamp: timestamp({ mode: "date", precision: 3 }).defaultNow().notNull(),
    createdAt: timestamp({
      mode: "date",
      precision: 3,
    }).defaultNow(), // Additional timestamp for compatibility

    // Enterprise features
    complianceLevel: varchar({ length: 50 }).default("standard"), // standard, high, critical
    retentionPeriod: integer().default(2555), // Days to retain (7 years default)
  },
  (table) => [
    // CRITICAL INDEXES for Audit Log performance
    index("audit_table_record_idx").on(table.tableName, table.recordId),
    index("audit_user_idx").on(table.userId),
    index("audit_user_email_index_idx").on(table.userEmailIndex),
    index("audit_timestamp_idx").on(table.timestamp.desc()),
    index("audit_action_time_idx").on(table.action, table.timestamp.desc()),
  ],
);

// Audit Configuration for system-wide audit settings
export const auditConfiguration = pgTable("audit_configuration", {
  id: serial("id").primaryKey(),

  // Global audit settings
  enabled: boolean().default(true),
  trackAllTables: boolean().default(false),
  trackedTables: jsonb().$type<string[]>(), // Specific tables to audit

  // Retention policies
  defaultRetentionDays: integer().default(2555), // 7 years
  highComplianceRetentionDays: integer().default(3650), // 10 years
  criticalComplianceRetentionDays: integer().default(7300), // 20 years

  // Performance settings
  batchSize: integer().default(100),
  asyncProcessing: boolean().default(true),

  // Privacy settings
  excludeSensitiveFields: jsonb().$type<string[]>(),
  encryptPayloads: boolean().default(false),

  // Notification settings
  alertOnCriticalChanges: boolean().default(true),
  alertThreshold: integer().default(100), // Number of changes per hour

  isActive: boolean().default(true),
  createdAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp({
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Types
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

export type AnimationError = typeof animationErrors.$inferSelect;
export type InsertAnimationError = typeof animationErrors.$inferInsert;

export type LogoAnimationSettings = typeof logoAnimationSettings.$inferSelect;
export type InsertLogoAnimationSettings = typeof logoAnimationSettings.$inferInsert;

export type StorageAnalysisResult = typeof storageAnalysisResults.$inferSelect;
export type InsertStorageAnalysisResult = typeof storageAnalysisResults.$inferInsert;

export type StorageChangeLog = typeof storageChangeLogs.$inferSelect;
export type InsertStorageChangeLog = typeof storageChangeLogs.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type AuditConfiguration = typeof auditConfiguration.$inferSelect;
export type InsertAuditConfiguration = typeof auditConfiguration.$inferInsert;

// Zod Schemas
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics);
export const selectPerformanceMetricSchema = createSelectSchema(performanceMetrics);

export const insertAnimationErrorSchema = createInsertSchema(animationErrors);
export const selectAnimationErrorSchema = createSelectSchema(animationErrors);

export const insertLogoAnimationSettingsSchema = createInsertSchema(logoAnimationSettings);
export const selectLogoAnimationSettingsSchema = createSelectSchema(logoAnimationSettings);

export const insertStorageAnalysisResultSchema = createInsertSchema(storageAnalysisResults);
export const selectStorageAnalysisResultSchema = createSelectSchema(storageAnalysisResults);

export const insertStorageChangeLogSchema = createInsertSchema(storageChangeLogs);
export const selectStorageChangeLogSchema = createSelectSchema(storageChangeLogs);

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const selectAuditLogSchema = createSelectSchema(auditLogs);

export const insertAuditConfigurationSchema = createInsertSchema(auditConfiguration);
export const selectAuditConfigurationSchema = createSelectSchema(auditConfiguration);

// ============================================================================
// Utility Schemas (Migrated from server/routes/utilities)
// ============================================================================

export const MetricsErrorsQuerySchema = z.object({
  type: z.string().optional(),
  severity: z.string().optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const MetricsAlertsQuerySchema = z.object({
  type: z.enum(["slow_query", "error_rate", "http_error_rate", "circuit_breaker"]).optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const FeatureFlagsQuerySchema = z.object({
  limit: z.coerce.number().min(0).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const FeatureFlagParamSchema = z.object({
  flag: z.string().min(1),
});

export const FeatureFlagUpdateBodySchema = z.object({
  enabled: z.boolean(),
});

export const ResourcesBatchQuerySchema = z.object({
  types: z.string().optional().default("all"),
  active: z.enum(["true", "false"]).optional(),
});

export const CacheInvalidationQuerySchema = z.object({
  pattern: z.string().min(1),
});
