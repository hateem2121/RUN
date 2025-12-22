import type { MediaAsset } from '@shared/schema';
import { Box, Camera, ChevronDown, ChevronRight, Image as ImageIcon, Star, Trash2, Video } from 'lucide-react';
import { memo, useState } from 'react';
import { StandardMediaSelectionDialog } from '@/components/admin/shared/StandardMediaSelectionDialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { Label } from '@/components/ui/label';

// import UnifiedModelViewer from '@/components/ui/UnifiedModelViewer';
// Simple Media Grid Component for Product Management
interface SimpleMediaGridProps {
  mediaAssets: MediaAsset[];
  onOrderChange?: (reorderedAssets: MediaAsset[]) => void;
  className?: string;
  gridCols?: number;
  itemSize?: string;
  showStars?: boolean;
  primaryImageId?: number | null;
  primaryVideoId?: number | null;
  onStarToggle?: (assetId: number, assetType: 'image' | 'video') => void;
  autoPlayOnHover?: boolean;
  showVideoControls?: boolean;
}

function SimpleMediaGrid({
  mediaAssets,
  onOrderChange,
  className,
  showStars = false,
  primaryImageId,
  primaryVideoId,
  onStarToggle,
  autoPlayOnHover = false,
  showVideoControls = false
}: SimpleMediaGridProps) {
  // Defensive programming: Validate mediaAssets
  if (!Array.isArray(mediaAssets)) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>Unable to display media assets</p>
        <p className="text-sm">Invalid data format</p>
      </div>
    );
  }

  if (mediaAssets.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>No media assets to display</p>
      </div>
    );
  }

  const handleRemoveAsset = (assetId: number) => {
    if (onOrderChange && Array.isArray(mediaAssets)) {
      const updatedAssets = mediaAssets.filter(asset => asset && asset.id !== assetId);
      onOrderChange(updatedAssets);
    }
  };

  const isPrimary = (asset: MediaAsset) => {
    if (!asset || typeof asset.id !== 'number') return false;
    return asset.type === 'image' ? asset.id === primaryImageId : asset.id === primaryVideoId;
  };

  return (
    <div className={`grid gap-3 ${className || 'grid-cols-4'}`}>
      {mediaAssets.filter(asset => asset && asset.id).map((asset) => (
        <div key={asset.id} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {asset.type === 'image' ? (
              <img
                src={asset.url || ''}
                alt={asset.filename || ''}
                className="w-full h-full object-cover"
              />
            ) : asset.type === 'video' ? (
              <video
                src={asset.url || ''}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                {...(autoPlayOnHover && {
                  onMouseEnter: (e) => e.currentTarget.play(),
                  onMouseLeave: (e) => e.currentTarget.pause()
                })}
                {...(showVideoControls && { controls: true })}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Box className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Star Toggle */}
          {showStars && onStarToggle && (
            <button
              type="button"
              onClick={() => onStarToggle(asset.id, asset.type === 'image' ? 'image' : 'video')}
              className={`absolute top-2 left-2 p-1 rounded-full ${isPrimary(asset)
                ? 'bg-yellow-500 text-white'
                : 'bg-black/50 text-white hover:bg-yellow-500'
                }`}
            >
              <Star className={`w-4 h-4 ${isPrimary(asset) ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => handleRemoveAsset(asset.id)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Asset Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="truncate">{asset.filename || 'Unknown file'}</div>
            {asset.size && (
              <div className="text-gray-300">{Math.round(asset.size / 1024)} KB</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import { AdminProductsErrorBoundary } from '../shared/ErrorBoundary';
import { logger } from '../shared/logger';
import type { ProductFormFieldValue } from '../shared/types';
import { extractMediaIds, mapMediaIdsToAssets } from '../shared/utils';

interface MediaAssetsSectionProps {
  formData: {
    primaryImageId: number | null;
    primaryVideoId: number | null;
    imageIds: number[];
    videos: number[];
    modelFileId: number | null;
  };
  formErrors: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: (field: string, value: ProductFormFieldValue) => void;
  getMediaAsset: (id: number) => MediaAsset | undefined;
}

const MediaAssetsSection = memo(function MediaAssetsSection({
  formData,
  formErrors,
  isOpen,
  onToggle,
  onInputChange,
  getMediaAsset
}: MediaAssetsSectionProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [currentMediaField, setCurrentMediaField] = useState<'images' | 'videos' | 'model' | 'primaryImage' | 'primaryVideo' | null>(null);



  const openMediaPicker = (fieldType: typeof currentMediaField) => {
    setCurrentMediaField(fieldType);
    setIsMediaPickerOpen(true);
  };

  const handleMediaSelect = (value: MediaAsset | MediaAsset[] | number | number[] | undefined) => {
    if (!currentMediaField || value === undefined) return;

    // Extract IDs from MediaAsset objects or use numbers directly
    let ids: number[] = [];
    if (Array.isArray(value)) {
      ids = value.map(item => typeof item === 'number' ? item : item.id);
    } else if (typeof value === 'number') {
      ids = [value];
    } else if (value && typeof value === 'object' && 'id' in value) {
      ids = [value.id];
    }

    // Handle different field types with proper array/single value logic
    if (currentMediaField === 'images') {
      // Images field expects array - merge with existing
      const newImageIds = [...(formData.imageIds || [])];
      ids.forEach(id => {
        if (!newImageIds.includes(id)) {
          newImageIds.push(id);
        }
      });
      onInputChange('imageIds', newImageIds);
    } else if (currentMediaField === 'videos') {
      // Videos field expects array - merge with existing
      const newVideoIds = [...(formData.videos || [])];
      ids.forEach(id => {
        if (!newVideoIds.includes(id)) {
          newVideoIds.push(id);
        }
      });
      onInputChange('videos', newVideoIds);
    } else if (currentMediaField === 'model') {
      // Model field expects single value
      onInputChange('modelFileId', ids.length > 0 ? ids[0] ?? null : null);
    } else if (currentMediaField === 'primaryImage') {
      // Primary image expects single value
      onInputChange('primaryImageId', ids.length > 0 ? ids[0] ?? null : null);
    } else if (currentMediaField === 'primaryVideo') {
      // Primary video expects single value
      onInputChange('primaryVideoId', ids.length > 0 ? ids[0] ?? null : null);
    }

    logger.debug('Media selected and processed', {
      field: currentMediaField,
      originalValue: value,
      extractedIds: ids,
      resultingFormData: {
        imageIds: currentMediaField === 'images' ? [...(formData.imageIds || []), ...ids.filter(id => !(formData.imageIds || []).includes(id))] : (formData.imageIds || []),
        videos: currentMediaField === 'videos' ? [...(formData.videos || []), ...ids.filter(id => !(formData.videos || []).includes(id))] : (formData.videos || []),
        modelFileId: currentMediaField === 'model' ? (ids.length > 0 ? ids[0] : null) : formData.modelFileId,
        primaryImageId: currentMediaField === 'primaryImage' ? (ids.length > 0 ? ids[0] : null) : formData.primaryImageId,
        primaryVideoId: currentMediaField === 'primaryVideo' ? (ids.length > 0 ? ids[0] : null) : formData.primaryVideoId
      }
    });

    setIsMediaPickerOpen(false);
    setCurrentMediaField(null);
  };

  const removeMedia = (fieldType: string, mediaId: number) => {
    if (fieldType === 'images') {
      onInputChange('imageIds', (formData.imageIds || []).filter(id => id !== mediaId));
    } else if (fieldType === 'videos') {
      onInputChange('videos', (formData.videos || []).filter(id => id !== mediaId));
    } else if (fieldType === 'primaryImage') {
      onInputChange('primaryImageId', null);
    } else if (fieldType === 'primaryVideo') {
      onInputChange('primaryVideoId', null);
    } else if (fieldType === 'model') {
      onInputChange('modelFileId', null);
    }
    logger.debug('Media removed', { fieldType, mediaId });
  };

  // Handle star toggle for primary media selection
  const handleStarToggle = (assetId: number, assetType: 'image' | 'video') => {
    if (assetType === 'image') {
      // Toggle primary image
      const newPrimaryImageId = formData.primaryImageId === assetId ? null : assetId;
      onInputChange('primaryImageId', newPrimaryImageId);
      logger.debug('Primary image toggled', { assetId, newPrimaryImageId });
    } else if (assetType === 'video') {
      // Toggle primary video
      const newPrimaryVideoId = formData.primaryVideoId === assetId ? null : assetId;
      onInputChange('primaryVideoId', newPrimaryVideoId);
      logger.debug('Primary video toggled', { assetId, newPrimaryVideoId });
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Media Assets</h3>
              <p className="text-sm text-gray-600">Images, videos, and 3D models</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-6 px-4 pb-4">

          {/* Product Images with Star System */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">Product Images</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">⭐ Click stars to set primary</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openMediaPicker('images')}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
              </div>
            </div>
            {(formData.imageIds || []).length > 0 ? (
              <AdminProductsErrorBoundary sectionName="Image Grid" fallbackMessage="Unable to display images. Media grid encountered an error.">
                <SimpleMediaGrid
                  mediaAssets={mapMediaIdsToAssets(formData.imageIds || [], getMediaAsset)}
                  onOrderChange={(reorderedAssets: MediaAsset[]) => onInputChange('imageIds', extractMediaIds(reorderedAssets))}
                  className="grid-cols-4 gap-3"
                  gridCols={4}
                  showStars={true}
                  primaryImageId={formData.primaryImageId}
                  onStarToggle={handleStarToggle}
                />
              </AdminProductsErrorBoundary>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No images selected</p>
              </div>
            )}
            {formErrors.imageIds && (
              <p className="text-red-600 text-sm mt-1">{formErrors.imageIds}</p>
            )}
            {formErrors.primaryImageId && (
              <p className="text-red-600 text-sm mt-1">{formErrors.primaryImageId}</p>
            )}
          </div>



          {/* Product Videos with Star System */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">Product Videos</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">⭐ Click stars to set primary</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openMediaPicker('videos')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add Videos
                </Button>
              </div>
            </div>
            {(formData.videos || []).length > 0 ? (
              <AdminProductsErrorBoundary sectionName="Video Grid" fallbackMessage="Unable to display videos. Video grid encountered an error.">
                <SimpleMediaGrid
                  mediaAssets={mapMediaIdsToAssets(formData.videos || [], getMediaAsset)}
                  onOrderChange={(reorderedAssets: MediaAsset[]) => onInputChange('videos', extractMediaIds(reorderedAssets))}
                  className="grid-cols-3 gap-3"
                  gridCols={3}
                  autoPlayOnHover={true}
                  showVideoControls={true}
                  showStars={true}
                  primaryVideoId={formData.primaryVideoId}
                  onStarToggle={handleStarToggle}
                />
              </AdminProductsErrorBoundary>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No videos selected</p>
              </div>
            )}
            {formErrors.videos && (
              <p className="text-red-600 text-sm mt-1">{formErrors.videos}</p>
            )}
            {formErrors.primaryVideoId && (
              <p className="text-red-600 text-sm mt-1">{formErrors.primaryVideoId}</p>
            )}
          </div>

          {/* 3D Model */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">3D Model</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaPicker('model')}
              >
                <Box className="h-4 w-4 mr-2" />
                Select Model
              </Button>
            </div>
            {formData.modelFileId ? (
              <div className="relative group">
                {(() => {
                  const asset = getMediaAsset(formData.modelFileId);
                  return asset ? (
                    <>
                      <div className="relative w-64 h-64 bg-gray-100 rounded-lg border overflow-hidden">
                        <LazyUnifiedModelViewer
                          asset={asset}
                          className="w-full h-full"
                          showControls={true}
                          showLoadingProgress={true}
                          showFileInfo={false}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia('model', formData.modelFileId!)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-64 h-64 bg-gray-200 rounded-lg border flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Asset not found</span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                <Box className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-gray-500 text-sm">No 3D model selected</span>
              </div>
            )}
            {formErrors.modelFileId && (
              <p className="text-red-600 text-sm mt-1">{formErrors.modelFileId}</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Unified Media Selection Dialog */}
      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => {
          setIsMediaPickerOpen(false);
          setCurrentMediaField(null);
        }}
        onSelect={(result: MediaAsset | MediaAsset[]) => {
          handleMediaSelect(result);
          if (currentMediaField !== 'images' && currentMediaField !== 'videos') {
            setIsMediaPickerOpen(false);
            setCurrentMediaField(null);
          }
        }}
        title={
          currentMediaField === 'images' ? 'Select Product Images' :
            currentMediaField === 'videos' ? 'Select Product Videos' :
              currentMediaField === 'model' ? 'Select 3D Model' :
                currentMediaField === 'primaryImage' ? 'Select Primary Image' :
                  currentMediaField === 'primaryVideo' ? 'Select Primary Video' :
                    'Select Media'
        }
        mediaPickerTarget={`product-${currentMediaField || 'media'}`}
        selectionMode={currentMediaField === 'images' || currentMediaField === 'videos' ? 'multiple' : 'single'}
        maxSelection={currentMediaField === 'images' ? 20 : 10}
        initialSelectedIds={currentMediaField === 'images' ? (formData.imageIds || []) :
          currentMediaField === 'videos' ? (formData.videos || []) :
            []}
      />
    </>
  );
});

// Default export for lazy loading compatibility
export default MediaAssetsSection;