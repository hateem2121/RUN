/**
 * PHASE 3: MEDIA SELECTION STANDARDIZATION
 *
 * Standard Media Selection Dialog Pattern
 *
 * This component demonstrates the unified pattern for media selection across
 * all admin components. All admin pages should follow this exact pattern.
 *
 * KEY BENEFITS:
 * - Consistent sizing using EnhancedDialogContent contentType='media-library'
 * - Real asset data integration (no mock data)
 * - Proper responsive behavior
 * - Standard UX patterns
 * - Unified error handling
 */

import type { MediaAsset } from "@shared/schema";
import { lazy, Suspense } from "react";
import { MediaLibraryEnhancedProvider } from "@/components/admin/media-library/MediaLibraryContextEnhanced";
import {
  EnhancedDialog,
  EnhancedDialogBody,
  EnhancedDialogContent,
  EnhancedDialogHeader,
  EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";

// CRITICAL FIX: Lazy-load MediaSelectionWrapperUnified to break circular dependency chain
// This prevents: StandardMediaSelectionDialog → MediaSelectionWrapperUnified → MediaLibraryContainerEnhanced
// from loading synchronously and blocking admin module initialization
const MediaSelectionWrapperUnified = lazy(() =>
  import("./MediaSelectionWrapperUnified").then((m) => ({
    default: m.MediaSelectionWrapperUnified,
  })),
);

interface StandardMediaSelectionDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;

  /** Called when dialog should close */
  onClose: () => void;

  /** Called when media is selected */
  onSelect: (assets: MediaAsset[] | MediaAsset) => void;

  /** Dialog title */
  title?: string;

  /** Media picker context identifier for filtering */
  mediaPickerTarget: string;

  /** Selection mode */
  selectionMode?: "single" | "multiple";

  /** Maximum number of assets for multiple selection */
  maxSelection?: number;

  /** Pre-selected asset IDs */
  initialSelectedIds?: number[];
}

/**
 * STANDARD PATTERN: All admin components should follow this exact structure
 *
 * REQUIRED ELEMENTS:
 * 1. EnhancedDialog with open/onOpenChange props
 * 2. EnhancedDialogContent with contentType='media-library'
 * 3. MediaLibraryEnhancedProvider wrapper
 * 4. MediaSelectionWrapperUnified with className="h-full"
 * 5. Proper event handlers
 */
export function StandardMediaSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  title = "Select Media",
  mediaPickerTarget,
  selectionMode = "single",
  maxSelection = 10,
  initialSelectedIds = [],
}: StandardMediaSelectionDialogProps) {
  const handleSelect = (assets: MediaAsset[] | MediaAsset) => {
    onSelect(assets);
    onClose();
  };

  return (
    <EnhancedDialog open={isOpen} onOpenChange={onClose}>
      <EnhancedDialogContent
        contentType="media-library"
        preferredSize="5xl" // Optimal size for media selection across all devices - EnhancedDialogContent handles all sizing
        className="flex flex-col" // Explicit flex layout for proper slot distribution
      >
        <EnhancedDialogHeader className="shrink-0 border-border border-b pb-4">
          <EnhancedDialogTitle>{title}</EnhancedDialogTitle>
        </EnhancedDialogHeader>

        {/* ARCHITECTURAL FIX: Bounded height container for scroll ownership */}
        <EnhancedDialogBody className="p-0">
          <MediaLibraryEnhancedProvider>
            <Suspense
              fallback={
                <div className="flex h-[600px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                    <p className="text-gray-600 text-sm">Loading media library...</p>
                  </div>
                </div>
              }
            >
              <MediaSelectionWrapperUnified
                onSelect={handleSelect}
                onCancel={onClose}
                mediaPickerTarget={mediaPickerTarget}
                selectionMode={selectionMode}
                maxSelection={maxSelection}
                initialSelectedIds={initialSelectedIds}
                className="h-full"
              />
            </Suspense>
          </MediaLibraryEnhancedProvider>
        </EnhancedDialogBody>
      </EnhancedDialogContent>
    </EnhancedDialog>
  );
}

/**
 * USAGE EXAMPLE for admin components:
 *
 * ```tsx
 * // 1. Add state to manage dialog
 * const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
 *
 * // 2. Add trigger button
 * <Button onClick={() => setMediaPickerOpen(true)}>
 *   Select Media
 * </Button>
 *
 * // 3. Add dialog component
 * <StandardMediaSelectionDialog
 *   isOpen={mediaPickerOpen}
 *   onClose={() => setMediaPickerOpen(false)}
 *   onSelect={(asset) => {
 *     // Handle selected asset
 *     setFormData({ ...formData, imageId: asset.id });
 *   }}
 *   title="Select Product Image"
 *   mediaPickerTarget="product-image"
 *   selectionMode="single"
 * />
 * ```
 *
 * MIGRATION GUIDE:
 * - Replace all custom media picker implementations with this pattern
 * - Remove hardcoded sizing (max-w-6xl, h-[85vh], etc.)
 * - Replace MediaLibraryEnhancedProvider + MediaSelectionWrapperUnified boilerplate
 * - Use contentType='media-library' for automatic optimal sizing
 */

export default StandardMediaSelectionDialog;
