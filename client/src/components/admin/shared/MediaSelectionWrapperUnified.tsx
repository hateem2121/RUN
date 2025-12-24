import type { MediaAsset } from "@shared/schema";
import { AlertCircle, Check, FileIcon, Image, Video, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import MediaLibraryContainerEnhanced from "@/components/admin/media-library/MediaLibraryContainerEnhanced";
import { useMediaLibraryEnhanced } from "@/components/admin/media-library/MediaLibraryContextEnhanced";
import { Button } from "@/components/ui/button";

interface UnifiedMediaSelectionProps {
	onSelect: (assets: MediaAsset[] | MediaAsset) => void;
	onCancel?: () => void;
	mediaPickerTarget: string;
	selectionMode?: "single" | "multiple";
	maxSelection?: number;
	initialSelectedIds?: number[];
	className?: string; // Allow custom sizing from parent dialog
}

// Simplified filter mapping
const getAutoFilterType = (target: string): string => {
	if (target.includes("video")) return "video";
	if (target.includes("image")) return "image";
	if (target.includes("3d") || target.includes("model")) return "model";
	if (target.includes("document")) return "document";
	return "all";
};

const getAssetIcon = (type: string) => {
	switch (type) {
		case "image":
			return <Image className="h-4 w-4" />;
		case "video":
			return <Video className="h-4 w-4" />;
		case "model":
			return <FileIcon className="h-4 w-4" />;
		default:
			return <FileIcon className="h-4 w-4" />;
	}
};

const getAssetTypeColor = (type: string) => {
	switch (type) {
		case "image":
			return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
		case "video":
			return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
		case "model":
			return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
	}
};

/**
 * Unified MediaSelectionWrapper - Eliminates complex workarounds
 *
 * Key improvements:
 * - Single source of truth: MediaLibraryContext with real asset data
 * - No isolated state or global events
 * - Uses existing infinite scroll data
 * - Unified single/multiple selection handling
 * - Flexible sizing for different dialog contexts
 * - Real MediaAsset data integration (no mock data)
 */
export function MediaSelectionWrapperUnified({
	onSelect,
	onCancel,
	mediaPickerTarget,
	selectionMode = "single",
	maxSelection = 10,
	initialSelectedIds = [],
	className = "",
}: UnifiedMediaSelectionProps) {
	const {
		state,
		assets, // Real asset data from context
		setSelectedType,
		selectAssets,
		clearSelection,
	} = useMediaLibraryEnhanced();

	// Initialize selection state with provided IDs
	React.useEffect(() => {
		if (initialSelectedIds.length > 0) {
			selectAssets(initialSelectedIds);
		}
	}, [initialSelectedIds, selectAssets]);

	// Auto-set filter type based on picker context
	React.useEffect(() => {
		const autoFilterType = getAutoFilterType(mediaPickerTarget);
		if (autoFilterType !== "all" && state.selectedType !== autoFilterType) {
			setSelectedType(autoFilterType);
		}
	}, [mediaPickerTarget, state.selectedType, setSelectedType]);

	// Get selected assets from context state - no separate API calls needed
	const selectedAssetIds = Array.from(state.selectedAssets);
	const hasSelection = selectedAssetIds.length > 0;

	// SELECTION FIX: Store full asset objects, not just IDs
	const [selectedAssetsCache, setSelectedAssetsCache] = useState<
		Map<number, MediaAsset>
	>(new Map());

	// Custom asset selection handler respecting mode and limits
	const handleAssetSelect = (assetId: number, asset?: MediaAsset) => {
		// Use provided asset or fallback to finding it
		const selectedAsset = asset || assets.find((a) => a.id === assetId);

		if (selectedAsset) {
			// CACHE FIX: Store full asset object for later retrieval
			setSelectedAssetsCache((prev) => {
				const updated = new Map(prev);
				updated.set(assetId, selectedAsset);
				return updated;
			});
		} else {
		}

		const currentSelection = new Set(state.selectedAssets);

		if (selectionMode === "single") {
			selectAssets([assetId]);
		} else {
			// Multiple selection: toggle selection with limits
			if (currentSelection.has(assetId)) {
				currentSelection.delete(assetId);
				selectAssets(Array.from(currentSelection));

				// Remove from cache when deselected
				setSelectedAssetsCache((prev) => {
					const updated = new Map(prev);
					updated.delete(assetId);
					return updated;
				});
			} else if (currentSelection.size < maxSelection) {
				currentSelection.add(assetId);
				selectAssets(Array.from(currentSelection));
			} else {
			}
		}
	};

	const handleConfirmSelection = async () => {
		if (selectedAssetIds.length > 0) {
			// CACHE FIX: Use cached assets first, fallback to current page assets, then API
			const { foundAssets, missingIds } = selectedAssetIds.reduce<{
				foundAssets: MediaAsset[];
				missingIds: number[];
			}>(
				(acc, id) => {
					// Try cache first (contains assets from all pages)
					let foundAsset = selectedAssetsCache.get(id);

					if (foundAsset) {
						acc.foundAssets.push(foundAsset);
						return acc;
					}

					// Fallback to current page assets
					foundAsset = assets.find((asset) => asset.id === id);

					if (foundAsset) {
						acc.foundAssets.push(foundAsset);
						return acc;
					}
					acc.missingIds.push(id);
					return acc;
				},
				{ foundAssets: [], missingIds: [] },
			);

			// API FALLBACK: Fetch missing assets by ID
			if (missingIds.length > 0) {
				try {
					const responses = await Promise.all(
						missingIds.map((id) =>
							fetch(`/api/media/${id}`)
								.then((res) => {
									if (!res.ok) throw new Error(`Failed to fetch asset ${id}`);
									return res.json();
								})
								.catch((err) => {
									return null;
								}),
						),
					);

					const fetchedAssets = responses.filter(Boolean) as MediaAsset[];

					// Add fetched assets to the result
					foundAssets.push(...fetchedAssets);
				} catch (error) {}
			}

			if (foundAssets.length > 0) {
				const result =
					selectionMode === "single" ? foundAssets[0]! : foundAssets;

				try {
					onSelect(result);
				} catch (error) {}
			} else {
			}
		} else {
		}
	};

	const handleClearSelection = () => {
		clearSelection();
	};

	const handleRemoveAsset = (assetId: number) => {
		const updatedSelection = new Set(state.selectedAssets);
		updatedSelection.delete(assetId);
		selectAssets(Array.from(updatedSelection));
	};

	// CACHE FIX: Get display data from cache first, fallback to current page
	const selectedAssetsForDisplay = useMemo(() => {
		return selectedAssetIds
			.map((id) => {
				// Try cache first (multi-page selections)
				const cachedAsset = selectedAssetsCache.get(id);
				if (cachedAsset) return cachedAsset;

				// Fallback to current page assets
				return assets.find((asset: MediaAsset) => asset.id === id);
			})
			.filter(Boolean) as MediaAsset[];
	}, [selectedAssetIds, assets, selectedAssetsCache]);

	return (
		<div className={`flex flex-col h-full min-h-0 ${className}`}>
			{/* SCROLL FIX: Own the scroll container to prevent 3D model viewers from stealing wheel events */}
			<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
				<MediaLibraryContainerEnhanced
					selectionMode={true}
					useExistingContext={true}
					mediaPickerTarget={mediaPickerTarget}
					initialFilter={getAutoFilterType(mediaPickerTarget)}
					onAssetSelect={handleAssetSelect}
				/>
			</div>

			{/* Fixed/Floating selection confirmation bar */}
			{hasSelection && (
				<div
					className="
            shrink-0 z-20 supports-[backdrop-filter]:bg-white/90 
            border-t shadow-xl transition-all duration-300 ease-out
            py-4 px-6 pb-[calc(theme(spacing.4)+env(safe-area-inset-bottom))]
            flex flex-col gap-4
            bg-gradient-to-br from-blue-50/95 via-indigo-50/95 to-cyan-50/95 border-blue-300/50 shadow-sm-blue-200/20
          "
					data-testid="bar-selection-confirmation"
				>
					{/* Selected assets display for multiple mode */}
					{selectionMode === "multiple" &&
						selectedAssetsForDisplay.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
									<h4 className="text-sm font-semibold text-gray-700">
										Selected Assets
									</h4>
									<div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
								</div>
								<div className="flex flex-wrap gap-3 max-h-28 overflow-y-auto custom-scrollbar">
									{selectedAssetsForDisplay.map((asset: MediaAsset) => (
										<div
											key={asset.id}
											className={`
                    group relative flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 
                    transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                    min-w-0 max-w-56
                    ${getAssetTypeColor(asset.type)}
                  `}
											data-testid={`badge-selected-asset-${asset.id}`}
										>
											<div className="shrink-0 p-1.5 bg-white/70 rounded-lg">
												{getAssetIcon(asset.type)}
											</div>
											<div className="flex-1 min-w-0">
												<div
													className="text-sm font-medium truncate"
													title={asset.originalName || asset.filename}
												>
													{asset.originalName || asset.filename}
												</div>
												<div className="text-xs opacity-70 uppercase tracking-wide">
													{asset.type.replace("_", " ")}
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												className="
                      shrink-0 h-7 w-7 p-0 rounded-full 
                      bg-white/70 hover:bg-red-50 hover:text-red-600
                      opacity-60 group-hover:opacity-100 transition-all duration-200
                      border-2 border-transparent hover:border-red-200
                    "
												onClick={() => handleRemoveAsset(asset.id)}
												data-testid={`button-remove-asset-${asset.id}`}
												title="Remove asset"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							</div>
						)}

					{/* Error state when selection can't be resolved */}
					{selectedAssetIds.length > 0 &&
						selectedAssetsForDisplay.length === 0 && (
							<div className="flex items-center gap-2 text-amber-600 text-sm">
								<AlertCircle className="h-4 w-4" />
								<span>
									Some selected assets could not be found. Please refresh and
									try again.
								</span>
							</div>
						)}

					{/* Selection status and controls */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							{hasSelection ? (
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-3">
										<div className="relative">
											<div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
											<div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-ping opacity-20"></div>
										</div>
										<div>
											<div className="font-semibold text-gray-800 text-base">
												{selectionMode === "single" ? (
													<div className="flex items-center gap-2">
														<span>Ready to select:</span>
														<span className="text-blue-700 bg-blue-100 px-2 py-1 rounded-md text-sm font-medium">
															{selectedAssetsForDisplay[0]?.originalName ||
																selectedAssetsForDisplay[0]?.filename ||
																"Asset"}
														</span>
													</div>
												) : (
													<div className="flex items-center gap-2">
														<span className="text-blue-700 bg-blue-100 px-2 py-1 rounded-md text-sm font-bold">
															{selectedAssetIds.length}
														</span>
														<span>
															asset{selectedAssetIds.length > 1 ? "s" : ""}{" "}
															selected
														</span>
													</div>
												)}
											</div>
											<div className="text-xs text-gray-500 mt-0.5">
												{selectionMode === "multiple" &&
													`Maximum: ${maxSelection} assets`}
												{selectionMode === "single" && "Single selection mode"}
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="flex items-center gap-4">
									<div className="w-4 h-4 bg-gray-300 rounded-full opacity-60"></div>
									<div>
										<span className="text-sm text-gray-600 font-medium">
											Choose{" "}
											{selectionMode === "single"
												? "a media asset"
												: "media assets"}{" "}
											from above
										</span>
										<div className="text-xs text-gray-400 mt-0.5">
											{selectionMode === "multiple"
												? `Up to ${maxSelection} assets`
												: "Single selection"}
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="flex gap-3">
							{hasSelection && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleClearSelection}
									className="
                  text-gray-500 hover:text-red-600 hover:bg-red-50 
                  border border-gray-200 hover:border-red-200
                  transition-all duration-200 font-medium
                "
								>
									Clear All
								</Button>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={onCancel}
								className="
                border-gray-300 hover:border-gray-400 
                text-gray-700 hover:text-gray-800 hover:bg-gray-50
                font-medium transition-all duration-200
              "
							>
								Cancel
							</Button>
							<Button
								size="sm"
								disabled={!hasSelection}
								onClick={handleConfirmSelection}
								className={`
                font-semibold transition-all duration-200 shadow-lg hover:shadow-xl
                ${
									hasSelection
										? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-105 active:scale-95"
										: "bg-gray-100 text-gray-400 cursor-not-allowed"
								}
              `}
							>
								{hasSelection ? (
									<>
										<Check className="h-4 w-4 mr-2" />
										Confirm Selection
									</>
								) : (
									"Select Media"
								)}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
