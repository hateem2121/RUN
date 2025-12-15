/**
 * Global TypeScript module declarations for JavaScript modules
 * This eliminates compilation warnings when importing JS modules from TS files
 */

// REMOVED: storage-sync-auditor.js module declaration - JS file doesn't exist (orphaned types)

// Cleanup Scheduler Module
declare module '../lib/cleanup-scheduler.js' {
  export interface CleanupReport {
    success: boolean;
    message: string;
    cleanedFiles: number;
    cleanedReferences: number;
    freedSpace: string;
    autoCleanEnabled: boolean;
  }

  export interface CleanupStatus {
    lastCleanup: string;
    nextScheduledCleanup: string;
    cleanupEnabled: boolean;
    totalCleanedFiles: number;
    totalFreedSpace: string;
  }

  export class MediaCleanupScheduler {
    static getInstance(): MediaCleanupScheduler;
    performManualCleanup(autoClean?: boolean): Promise<CleanupReport>;
    getCleanupStatus(): Promise<CleanupStatus>;
  }

  export default { MediaCleanupScheduler };
}

// Media Performance Monitor Module
// Types imported from standalone declaration file
declare module '../lib/media-performance-monitor.js' {
  import type { PerformanceMetrics, DetailedStats, MediaPerformanceMonitor } from '../lib/media-performance-monitor';
  
  export const mediaPerformanceMonitor: MediaPerformanceMonitor;
  export default mediaPerformanceMonitor;
}

// Schema Enhancer Module
declare module '../lib/schema-enhancer.js' {
  export interface SchemaEnhancementResult {
    success: boolean;
    message: string;
    enhancementsApplied: string[];
    tablesProcessed: number;
    indexesOptimized: number;
    performanceImprovement: string;
    productsUpdated: number;
    categoriesUpdated: number;
    mediaUpdated: number;
    errors: string[];
  }

  export interface SchemaEnhancer {
    enhanceAll(): Promise<SchemaEnhancementResult>;
  }

  export const schemaEnhancer: SchemaEnhancer;
  export default schemaEnhancer;
}

// Media Validator Module
// Types imported from standalone declaration file
declare module '../lib/media-validator.js' {
  import type { MediaFileValidationResult, BatchMediaFileValidationResult } from '../../utils/types/validation';
  
  export class MediaValidator {
    static validateAsset(asset: any): MediaFileValidationResult;
    static validateBatch(assets: any[]): BatchMediaFileValidationResult;
  }

  export default { MediaValidator };
}
