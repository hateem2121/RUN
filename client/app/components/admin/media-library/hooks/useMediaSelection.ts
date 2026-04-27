import type { MediaAsset } from "@shared/index";
import { useCallback, useMemo } from "react";
import type { MediaLibraryAction, MediaLibraryState } from "../MediaLibraryContextEnhanced";

interface UseMediaSelectionParams {
  state: MediaLibraryState;
  dispatch: React.Dispatch<MediaLibraryAction>;
  assets: MediaAsset[];
}

interface UseMediaSelectionReturn {
  selectionData: {
    count: number;
    totalSize: number;
    typeCount: Record<string, number>;
    isEmpty: boolean;
    isAll: boolean;
    isPartial: boolean;
  };
  toggleAsset: (assetId: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (assetId: number) => boolean;
  selectAssets: (assetIds: number[]) => void;
}

export function useMediaSelection({
  state,
  dispatch,
  assets,
}: UseMediaSelectionParams): UseMediaSelectionReturn {
  const toggleAsset = useCallback(
    (assetId: number) => {
      const newSelectedAssets = new Set(state.selectedAssets);
      if (newSelectedAssets.has(assetId)) {
        newSelectedAssets.delete(assetId);
      } else {
        newSelectedAssets.add(assetId);
      }
      dispatch({ type: "SET_SELECTED_ASSETS", payload: newSelectedAssets });
    },
    [state.selectedAssets, dispatch],
  );

  const selectAll = useCallback(() => {
    dispatch({
      type: "SET_SELECTED_ASSETS",
      payload: new Set(assets.map((asset) => asset.id)),
    });
  }, [assets, dispatch]);

  const clearSelection = useCallback(() => {
    dispatch({ type: "SET_SELECTED_ASSETS", payload: new Set() });
  }, [dispatch]);

  const isSelected = useCallback(
    (assetId: number) => state.selectedAssets.has(assetId),
    [state.selectedAssets],
  );

  const selectAssets = useCallback(
    (assetIds: number[]) => {
      dispatch({ type: "SET_SELECTED_ASSETS", payload: new Set(assetIds) });
    },
    [dispatch],
  );

  const selectionData = useMemo(() => {
    const selected = assets.filter((asset) => state.selectedAssets.has(asset.id));
    const totalSize = selected.reduce((sum, asset) => sum + (asset.size || 0), 0);
    const typeCount = selected.reduce(
      (acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      count: selected.length,
      totalSize,
      typeCount,
      isEmpty: selected.length === 0,
      isAll: selected.length === assets.length,
      isPartial: selected.length > 0 && selected.length < assets.length,
    };
  }, [assets, state.selectedAssets]);

  return {
    selectionData,
    toggleAsset,
    selectAll,
    clearSelection,
    isSelected,
    selectAssets,
  };
}
