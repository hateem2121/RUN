import { useCallback, useMemo } from 'react';
import type { MediaAsset } from '@shared/schema';
// import { logger } from '../logger';

// Media operations interface
interface MediaOperations {
  mapMediaIdsToAssets: (ids: number[], getMediaAsset: (id: number) => MediaAsset | undefined) => MediaAsset[];
  extractMediaIds: (assets: MediaAsset[]) => number[];
  getMediaUrl: (asset: MediaAsset) => string;
  validateMediaAsset: (asset: MediaAsset) => boolean;
  getMediaTypeIcon: (type: string) => string;
  formatFileSize: (bytes: number) => string;
  groupMediaByType: (assets: MediaAsset[]) => Record<string, MediaAsset[]>;
}

export function useMediaOperations(): MediaOperations {

  // Map media IDs to actual media asset objects
  const mapMediaIdsToAssets = useCallback((
    ids: number[],
    getMediaAsset: (id: number) => MediaAsset | undefined
  ): MediaAsset[] => {
    return ids
      .map(id => getMediaAsset(id))
      .filter((asset): asset is MediaAsset => asset !== undefined);
  }, []);

  // Extract IDs from media asset objects
  const extractMediaIds = useCallback((assets: MediaAsset[]): number[] => {
    return assets.map(asset => asset.id);
  }, []);

  // Get media URL with fallback using unified content endpoint
  const getMediaUrl = useCallback((asset: MediaAsset): string => {
    if (!asset) return '';

    // Use unified content URL if available
    if (asset.url?.startsWith('/api/media/') && asset.url.includes('/content')) {
      return asset.url;
    }

    // Handle legacy proxy URLs by redirecting to unified endpoint
    if (asset.url?.startsWith('/api/media/proxy/')) {
      const id = asset.url.replace('/api/media/proxy/', '');
      return `/api/media/${id}/content`;
    }

    // Construct unified content URL from ID
    return `/api/media/${asset.id}/content`;
  }, []);

  // Validate media asset
  const validateMediaAsset = useCallback((asset: MediaAsset): boolean => {
    if (!asset || !asset.id) return false;
    if (!asset.filename || asset.filename.trim() === '') return false;
    if (!asset.type || asset.type.trim() === '') return false;

    return true;
  }, []);

  // Get icon for media type
  const getMediaTypeIcon = useCallback((type: string): string => {
    const iconMap: Record<string, string> = {
      image: '🖼️',
      video: '🎥',
      '3d_model': '📦',
      audio: '🎵',
      document: '📄',
      archive: '📦',
    };

    return iconMap[type] || '📄';
  }, []);

  // Format file size in human readable format
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Group media assets by type
  const groupMediaByType = useCallback((assets: MediaAsset[]): Record<string, MediaAsset[]> => {
    return assets.reduce((groups, asset) => {
      const type = asset.type || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(asset);
      return groups;
    }, {} as Record<string, MediaAsset[]>);
  }, []);

  return useMemo(() => ({
    mapMediaIdsToAssets,
    extractMediaIds,
    getMediaUrl,
    validateMediaAsset,
    getMediaTypeIcon,
    formatFileSize,
    groupMediaByType,
  }), [
    mapMediaIdsToAssets,
    extractMediaIds,
    getMediaUrl,
    validateMediaAsset,
    getMediaTypeIcon,
    formatFileSize,
    groupMediaByType,
  ]);
}