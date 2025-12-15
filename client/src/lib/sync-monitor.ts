/**
 * Client-side Sync Monitor
 * Real-time monitoring of synchronization between admin and public interfaces
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

// Development-only logging
const debugLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};

const errorLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(message, ...args);
  }
};

export interface SyncStatus {
  isHealthy: boolean;
  lastCheck: Date;
  errors: SyncError[];
  warnings: SyncWarning[];
  score: number;
  summary: string;
}

export interface SyncError {
  type: string;
  entity: string;
  field: string;
  value: unknown;
  message: string;
  severity: 'critical' | 'warning';
}

export interface SyncWarning extends SyncError {
  suggestedFix?: string;
}

/**
 * Hook for monitoring About page synchronization
 */
export function useAboutSyncMonitor() {
  const queryClient = useQueryClient();
  const [lastSyncCheck, setLastSyncCheck] = useState<Date | null>(null);

  // Query for sync validation status
  const syncQuery = useQuery({
    queryKey: ['/api/sync/validate', 'about'],
    queryFn: async (): Promise<SyncStatus> => {
      const response = await fetch('/api/sync/validate/about');
      if (!response.ok) {
        throw new Error(`Sync validation failed: ${response.statusText}`);
      }
      const result = await response.json();
      
      return {
        isHealthy: result.overall === 'healthy',
        lastCheck: new Date(),
        errors: result.details.errors || [],
        warnings: result.details.warnings || [],
        score: result.score || 0,
        summary: result.summary || 'Unknown status'
      };
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchInterval: 60000, // Check every minute
    refetchOnWindowFocus: true
  });

  // Manual sync validation trigger
  const validateSync = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/sync/validate', 'about'] });
    setLastSyncCheck(new Date());
  }, [queryClient]);

  // Auto-fix broken references
  const autoFix = useCallback(async (dryRun: boolean = false) => {
    try {
      const response = await fetch('/api/sync/auto-fix/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun })
      });

      if (!response.ok) {
        throw new Error(`Auto-fix failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh sync status after fixing
      if (!dryRun && result.applied.length > 0) {
        await validateSync();
        
        // Invalidate related queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['/api/about-hero'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/about-sections'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/about-team-message'] });
      }

      return result;
    } catch (error) {
      errorLog('[SyncMonitor] Auto-fix failed:', error);
      throw error;
    }
  }, [validateSync, queryClient]);

  // Cache invalidation for real-time sync
  const invalidateAboutCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/about-hero'] });
    queryClient.invalidateQueries({ queryKey: ['/api/about-sections'] });
    queryClient.invalidateQueries({ queryKey: ['/api/about-timeline'] });
    queryClient.invalidateQueries({ queryKey: ['/api/about-statistics'] });
    queryClient.invalidateQueries({ queryKey: ['/api/about-locations'] });
    queryClient.invalidateQueries({ queryKey: ['/api/about-team-message'] });
    
    // Also refresh sync status
    validateSync();
  }, [queryClient, validateSync]);

  // Listen for admin changes and invalidate cache
  useEffect(() => {
    const handleAdminChange = (event: CustomEvent) => {
      if (event.detail?.entity?.startsWith('about')) {
        debugLog('[SyncMonitor] Admin change detected, invalidating cache');
        invalidateAboutCache();
      }
    };

    window.addEventListener('admin-data-change', handleAdminChange as EventListener);
    
    return () => {
      window.removeEventListener('admin-data-change', handleAdminChange as EventListener);
    };
  }, [invalidateAboutCache]);

  return {
    syncStatus: syncQuery.data,
    isLoading: syncQuery.isLoading,
    isError: syncQuery.isError,
    error: syncQuery.error,
    lastSyncCheck,
    validateSync,
    autoFix,
    invalidateAboutCache
  };
}

/**
 * Hook for real-time sync status notifications
 */
export function useSyncNotifications() {
  const [notifications, setNotifications] = useState<{
    id: string;
    type: 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }[]>([]);

  const addNotification = useCallback((type: 'success' | 'warning' | 'error', message: string) => {
    const notification = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type,
      message,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  };
}

/**
 * Utility to dispatch admin change events
 */
export function dispatchAdminChange(entity: string, action: 'create' | 'update' | 'delete', data?: unknown) {
  const event = new CustomEvent('admin-data-change', {
    detail: {
      entity,
      action,
      data,
      timestamp: new Date()
    }
  });
  
  window.dispatchEvent(event);
}

/**
 * Sync health indicator component data
 */
export function useSyncHealthIndicator() {
  const { syncStatus, isLoading } = useAboutSyncMonitor();

  if (isLoading || !syncStatus) {
    return {
      status: 'loading' as const,
      color: 'gray',
      message: 'Checking sync status...',
      score: 0
    };
  }

  if (!syncStatus.isHealthy && syncStatus.errors.some(e => e.severity === 'critical')) {
    return {
      status: 'critical' as const,
      color: 'red',
      message: `${syncStatus.errors.filter(e => e.severity === 'critical').length} critical issues`,
      score: syncStatus.score
    };
  }

  if (syncStatus.warnings.length > 0) {
    return {
      status: 'warning' as const,
      color: 'yellow',
      message: `${syncStatus.warnings.length} warnings`,
      score: syncStatus.score
    };
  }

  return {
    status: 'healthy' as const,
    color: 'green',
    message: 'All systems synchronized',
    score: syncStatus.score
  };
}