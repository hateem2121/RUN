import {
  boolean,
  decimal,
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "./common";

// Performance Metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type", { length: 100 }).notNull(),
  componentName: varchar("component_name", { length: 255 }).notNull(),
  component: varchar("component", { length: 255 }), // Additional component field for compatibility
  value: decimal("value", { precision: 12, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Animation Errors
export const animationErrors = pgTable("animation_errors", {
  id: serial("id").primaryKey(),
  errorType: varchar("error_type", { length: 100 }).notNull(),
  message: text("message").notNull(),
  stackTrace: text("stack_trace"),
  componentName: varchar("component_name", { length: 255 }),
  url: varchar("url", { length: 500 }),
  userAgent: varchar("user_agent", { length: 500 }),
  retryCount: integer("retry_count").default(0),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at", { mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Logo Animation Settings
export const logoAnimationSettings = pgTable("logo_animation_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  duration: integer("duration").default(2000),
  delay: integer("delay").default(0),
  easing: varchar("easing", { length: 100 }).default("ease-out"),
  scale: decimal("scale", { precision: 4, scale: 2 }).default("1.0"),
  rotation: integer("rotation").default(0),
  opacity: decimal("opacity", { precision: 3, scale: 2 }).default("1.0"),
  motionEnabled: boolean("motion_enabled").default(true), // Enable/disable motion animations
  motionSpeed: decimal("motion_speed", { precision: 3, scale: 2 }), // Animation speed multiplier
  motionElements: jsonb("motion_elements").$type<string[]>(), // Elements with motion applied
  animationDurationMultiplier: decimal("animation_duration_multiplier", {
    precision: 3,
    scale: 2,
  }).default("1.0"), // Duration multiplier
  drawStagger: decimal("draw_stagger", { precision: 4, scale: 2 }), // Stagger delay between elements
  drawEasing: varchar("draw_easing", { length: 100 }), // Draw animation easing
  skipButtonEnabled: boolean("skip_button_enabled").default(false), // Show skip button
  showFrequency: boolean("show_frequency").default(false), // Show frequency indicator
  customCssClass: varchar("custom_css_class", { length: 255 }), // Custom CSS class
  debugMode: boolean("debug_mode").default(false), // Debug mode for animation
  settings: jsonb("settings").$type<Record<string, any>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Storage Analysis Results
export const storageAnalysisResults = pgTable("storage_analysis_results", {
  id: serial("id").primaryKey(),
  timestamp: varchar("timestamp", { length: 50 }).notNull(),
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
  version: varchar("version", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Storage Change Logs
export const storageChangeLogs = pgTable("storage_change_logs", {
  id: serial("id").primaryKey(),
  timestamp: varchar("timestamp", { length: 50 }).notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  mediaId: integer("media_id").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  size: integer("size"),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

// Audit Logs for comprehensive change tracking
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),

  // Action details
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, RESTORE, SOFT_DELETE
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id", { length: 50 }).notNull(), // String to support various ID types

  // Change tracking
  oldValues: jsonb("old_values").$type<Record<string, any>>(), // Previous state
  newValues: jsonb("new_values").$type<Record<string, any>>(), // New state
  changedFields: jsonb("changed_fields").$type<string[]>(), // List of modified fields

  // User attribution
  userId: varchar("user_id", { length: 100 }), // User who made the change
  userEmail: varchar("user_email", { length: 255 }), // Email for tracking
  userRole: varchar("user_role", { length: 50 }), // Role at time of change

  // Request context
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6 support
  userAgent: text("user_agent"), // Browser/client information
  sessionId: varchar("session_id", { length: 255 }), // Session tracking

  // Additional metadata
  reason: text("reason"), // Optional reason for change
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional context

  // Timestamps
  timestamp: timestamp("timestamp", { mode: "date", precision: 3 }).defaultNow().notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(), // Additional timestamp for compatibility

  // Enterprise features
  complianceLevel: varchar("compliance_level", { length: 50 }).default("standard"), // standard, high, critical
  retentionPeriod: integer("retention_period").default(2555), // Days to retain (7 years default)
});

// Audit Configuration for system-wide audit settings
export const auditConfiguration = pgTable("audit_configuration", {
  id: serial("id").primaryKey(),

  // Global audit settings
  enabled: boolean("enabled").default(true),
  trackAllTables: boolean("track_all_tables").default(false),
  trackedTables: jsonb("tracked_tables").$type<string[]>(), // Specific tables to audit

  // Retention policies
  defaultRetentionDays: integer("default_retention_days").default(2555), // 7 years
  highComplianceRetentionDays: integer("high_compliance_retention_days").default(3650), // 10 years
  criticalComplianceRetentionDays: integer("critical_compliance_retention_days").default(7300), // 20 years

  // Performance settings
  batchSize: integer("batch_size").default(100),
  asyncProcessing: boolean("async_processing").default(true),

  // Privacy settings
  excludeSensitiveFields: jsonb("exclude_sensitive_fields").$type<string[]>(),
  encryptPayloads: boolean("encrypt_payloads").default(false),

  // Notification settings
  alertOnCriticalChanges: boolean("alert_on_critical_changes").default(true),
  alertThreshold: integer("alert_threshold").default(100), // Number of changes per hour

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
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
