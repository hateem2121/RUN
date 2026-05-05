import type { MediaAsset } from "@shared/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { invalidateMediaQueries, MediaQueryKeys } from "@/lib/media-query-keys";

// Import extracted hooks
import { useMediaFilters } from "./hooks/useMediaFilters";
import { useMediaSelection } from "./hooks/useMediaSelection";
import { useMediaUrlSync } from "./hooks/useMediaUrlSync";

// Type aliases for union types to reduce complexity
type UploadStatus = "pending" | "uploading" | "processing" | "complete" | "error";
type SyncStatus = "idle" | "syncing" | "success" | "error";

// ─── State & Action Definitions ────────────────────────────────────────────────

export interface MediaLibraryState {
  // Core Display & Navigation
  searchTerm: string;
  selectedType: string;
  selectedAssets: Set<number>;
  viewMode: "grid" | "list";
  sortBy: "name" | "size" | "uploadedAt" | "type";
  sortOrder: "asc" | "desc";
  showFiltersPanel: boolean;

  // Advanced Filters
  folderFilter: string;
  tagFilters: string[];
  dateRange: { from?: Date; to?: Date };
  sizeRange: { min?: number | undefined; max?: number };

  // Modal State
  selectedAsset: MediaAsset | null;
  selectedAssetIndex: number;
  lightboxOpen: boolean;
  editModalOpen: boolean;
  deleteModalOpen: boolean;

  // Upload State
  uploadProgress: Record<
    string,
    {
      progress: number;
      status: UploadStatus;
      error?: string | undefined;
    }
  >;
  isUploading: boolean;
  syncStatus: SyncStatus;

  // Pagination State
  currentPage: number;
  totalPages: number;
  totalAssets: number;

  // Error Handling
  errorState: {
    hasError: boolean;
    errorMessage: string;
  };
}

export type MediaLibraryAction =
  // Basic filters
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_SELECTED_TYPE"; payload: string }
  | { type: "SET_SELECTED_ASSETS"; payload: Set<number> }
  | { type: "SET_VIEW_MODE"; payload: "grid" | "list" }
  | { type: "SET_SORT_BY"; payload: "name" | "size" | "uploadedAt" | "type" }
  | { type: "SET_SORT_ORDER"; payload: "asc" | "desc" }
  | { type: "SET_SHOW_FILTERS_PANEL"; payload: boolean }

  // Advanced filters
  | { type: "SET_FOLDER_FILTER"; payload: string }
  | { type: "SET_TAG_FILTERS"; payload: string[] }
  | { type: "SET_DATE_RANGE"; payload: { from?: Date; to?: Date } }
  | {
      type: "SET_SIZE_RANGE";
      payload: { min?: number | undefined; max?: number };
    }

  // Modal actions
  | { type: "SET_SELECTED_ASSET"; payload: MediaAsset | null }
  | { type: "SET_SELECTED_ASSET_INDEX"; payload: number }
  | { type: "SET_LIGHTBOX_OPEN"; payload: boolean }
  | { type: "SET_EDIT_MODAL_OPEN"; payload: boolean }
  | { type: "SET_DELETE_MODAL_OPEN"; payload: boolean }

  // Upload actions
  | {
      type: "SET_UPLOAD_PROGRESS";
      payload: Record<string, { progress: number; status: UploadStatus; error?: string }>;
    }
  | { type: "SET_IS_UPLOADING"; payload: boolean }
  | { type: "SET_SYNC_STATUS"; payload: SyncStatus }

  // Pagination actions
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_TOTAL_PAGES"; payload: number }
  | { type: "SET_TOTAL_ASSETS"; payload: number }

  // Error actions
  | {
      type: "SET_ERROR_STATE";
      payload: { hasError: boolean; errorMessage: string };
    }
  | { type: "RESET_STATE" };

const initialState: MediaLibraryState = {
  searchTerm: "",
  selectedType: "all",
  selectedAssets: new Set(),
  viewMode: "grid",
  sortBy: "uploadedAt",
  sortOrder: "desc",
  showFiltersPanel: true,

  folderFilter: "",
  tagFilters: [],
  dateRange: {},
  sizeRange: {},

  selectedAsset: null,
  selectedAssetIndex: 0,
  lightboxOpen: false,
  editModalOpen: false,
  deleteModalOpen: false,

  uploadProgress: {},
  isUploading: false,
  syncStatus: "idle",

  currentPage: 1,
  totalPages: 1,
  totalAssets: 0,

  errorState: {
    hasError: false,
    errorMessage: "",
  },
};

function mediaLibraryReducer(
  state: MediaLibraryState,
  action: MediaLibraryAction,
): MediaLibraryState {
  switch (action.type) {
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_SELECTED_TYPE":
      return { ...state, selectedType: action.payload };
    case "SET_SELECTED_ASSETS":
      return { ...state, selectedAssets: action.payload };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_SORT_BY":
      return { ...state, sortBy: action.payload };
    case "SET_SORT_ORDER":
      return { ...state, sortOrder: action.payload };
    case "SET_SHOW_FILTERS_PANEL":
      return { ...state, showFiltersPanel: action.payload };

    case "SET_FOLDER_FILTER":
      return { ...state, folderFilter: action.payload };
    case "SET_TAG_FILTERS":
      return { ...state, tagFilters: action.payload };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload };
    case "SET_SIZE_RANGE":
      return { ...state, sizeRange: action.payload };

    case "SET_SELECTED_ASSET":
      return { ...state, selectedAsset: action.payload };
    case "SET_SELECTED_ASSET_INDEX":
      return { ...state, selectedAssetIndex: action.payload };
    case "SET_LIGHTBOX_OPEN":
      return { ...state, lightboxOpen: action.payload };
    case "SET_EDIT_MODAL_OPEN":
      return { ...state, editModalOpen: action.payload };
    case "SET_DELETE_MODAL_OPEN":
      return { ...state, deleteModalOpen: action.payload };

    case "SET_UPLOAD_PROGRESS":
      return { ...state, uploadProgress: action.payload };
    case "SET_IS_UPLOADING":
      return { ...state, isUploading: action.payload };
    case "SET_SYNC_STATUS":
      return { ...state, syncStatus: action.payload };

    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_TOTAL_PAGES":
      return { ...state, totalPages: action.payload };
    case "SET_TOTAL_ASSETS":
      return { ...state, totalAssets: action.payload };

    case "SET_ERROR_STATE":
      return { ...state, errorState: action.payload };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

// ─── Context Type ──────────────────────────────────────────────────────────────

interface MediaLibraryContextType {
  state: MediaLibraryState;
  dispatch: React.Dispatch<MediaLibraryAction>;

  updateState: <K extends keyof MediaLibraryState>(key: K, value: MediaLibraryState[K]) => void;

  // Filter methods (from useMediaFilters)
  updateFilter: <K extends keyof MediaLibraryState>(key: K, value: MediaLibraryState[K]) => void;
  resetFilters: () => void;
  clearSearch: () => void;
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  toggleSortOrder: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  getQueryParams: URLSearchParams;
  debouncedSearch: string;

  // Selection methods (from useMediaSelection)
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

  // Missing functions needed by MediaSelectionWrapperUnified
  assets: MediaAsset[];
  selectAssets: (assetIds: number[]) => void;
  setSelectedType: (type: string) => void;

  // Upload methods
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  clearUploadProgress: () => void;
  setSyncStatus: (status: SyncStatus) => void;

  // Modal methods
  setSelectedAsset: (asset: MediaAsset | null) => void;
  setSelectedAssetIndex: (index: number) => void;
  setLightboxOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean) => void;
  setDeleteModalOpen: (open: boolean) => void;

  // Pagination methods
  setCurrentPage: (page: number) => void;
  setTotalPages: (totalPages: number) => void;
  setTotalAssets: (totalAssets: number) => void;

  // Error methods
  setErrorState: (error: { hasError: boolean; errorMessage: string }) => void;

  // Asset synchronization
  updateAssets: (newAssets: MediaAsset[]) => void;
}

const MediaLibraryContext = createContext<MediaLibraryContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function MediaLibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mediaLibraryReducer, initialState);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Asset state from React Query
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  useEffect(() => {
    const allMediaQueries = queryClient.getQueriesData({
      queryKey: MediaQueryKeys.paginated,
    });

    const allAssets: MediaAsset[] = [];

    type MediaApiResponse = { data: MediaAsset[] } | { success: boolean; data: MediaAsset[] };

    for (const [_queryKey, queryData] of allMediaQueries) {
      const data = queryData as MediaApiResponse;
      if (data && "data" in data && Array.isArray(data.data)) {
        allAssets.push(...data.data);
      }
    }

    const uniqueAssets = Array.from(new Map(allAssets.map((asset) => [asset.id, asset])).values());

    if (uniqueAssets.length > 0) {
      setAssets(uniqueAssets);
    } else {
      setAssets([]);
    }
  }, [queryClient]);

  // ─── Extracted Hooks ───────────────────────────────────────────────────────────

  const filters = useMediaFilters({ state, dispatch });
  const selection = useMediaSelection({ state, dispatch, assets });
  useMediaUrlSync({ state, dispatch });

  // ─── State Updater ─────────────────────────────────────────────────────────────

  const updateState = useCallback(
    <K extends keyof MediaLibraryState>(key: K, value: MediaLibraryState[K]) => {
      const actionMap = {
        searchTerm: "SET_SEARCH_TERM",
        selectedType: "SET_SELECTED_TYPE",
        selectedAssets: "SET_SELECTED_ASSETS",
        viewMode: "SET_VIEW_MODE",
        sortBy: "SET_SORT_BY",
        sortOrder: "SET_SORT_ORDER",
        showFiltersPanel: "SET_SHOW_FILTERS_PANEL",
        folderFilter: "SET_FOLDER_FILTER",
        tagFilters: "SET_TAG_FILTERS",
        dateRange: "SET_DATE_RANGE",
        sizeRange: "SET_SIZE_RANGE",
        selectedAsset: "SET_SELECTED_ASSET",
        selectedAssetIndex: "SET_SELECTED_ASSET_INDEX",
        lightboxOpen: "SET_LIGHTBOX_OPEN",
        editModalOpen: "SET_EDIT_MODAL_OPEN",
        deleteModalOpen: "SET_DELETE_MODAL_OPEN",
        uploadProgress: "SET_UPLOAD_PROGRESS",
        isUploading: "SET_IS_UPLOADING",
        syncStatus: "SET_SYNC_STATUS",
        currentPage: "SET_CURRENT_PAGE",
        totalPages: "SET_TOTAL_PAGES",
        totalAssets: "SET_TOTAL_ASSETS",
        errorState: "SET_ERROR_STATE",
      } as const;

      const actionType = actionMap[key as keyof typeof actionMap];
      if (actionType) {
        dispatch({ type: actionType, payload: value } as MediaLibraryAction);
      }
    },
    [],
  );

  // ─── Upload Methods ────────────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: async (params: {
      files: FileList | File[];
      onProgress?: (progress: number) => void;
    }) => {
      const { files } = params;
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("file", file);
      }

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: async () => {
      try {
        toast({
          title: "Upload Complete",
          description: "Files uploaded successfully",
        });

        dispatch({ type: "SET_UPLOAD_PROGRESS", payload: {} });
        dispatch({ type: "SET_IS_UPLOADING", payload: false });

        await new Promise((resolve) => setTimeout(resolve, 500));
        await invalidateMediaQueries(queryClient);
      } catch (_error) {}
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
      dispatch({ type: "SET_IS_UPLOADING", payload: false });
    },
  });

  const uploadFiles = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      if (files.length === 0) {
        return;
      }

      dispatch({ type: "SET_IS_UPLOADING", payload: true });
      const fileArray = Array.from(files);

      const initialProgress: Record<
        string,
        { progress: number; status: UploadStatus; error?: string }
      > = {};
      for (let index = 0; index < fileArray.length; index++) {
        initialProgress[`file-${index}`] = {
          progress: 0,
          status: "pending",
        };
      }
      dispatch({ type: "SET_UPLOAD_PROGRESS", payload: initialProgress });

      try {
        await uploadMutation.mutateAsync({ files });
      } catch (_error) {}
    },
    [uploadMutation],
  );

  const clearUploadProgress = useCallback((): void => {
    dispatch({ type: "SET_UPLOAD_PROGRESS", payload: {} });
  }, []);

  const setSyncStatus = useCallback((status: SyncStatus): void => {
    dispatch({ type: "SET_SYNC_STATUS", payload: status });
  }, []);

  // ─── Modal Methods ─────────────────────────────────────────────────────────────

  const setSelectedAsset = useCallback((asset: MediaAsset | null) => {
    dispatch({ type: "SET_SELECTED_ASSET", payload: asset });
  }, []);

  const setLightboxOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_LIGHTBOX_OPEN", payload: open });
  }, []);

  const setEditModalOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_EDIT_MODAL_OPEN", payload: open });
  }, []);

  const setSelectedAssetIndex = useCallback((index: number) => {
    dispatch({ type: "SET_SELECTED_ASSET_INDEX", payload: index });
  }, []);

  const setDeleteModalOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_DELETE_MODAL_OPEN", payload: open });
  }, []);

  // ─── Pagination Methods ────────────────────────────────────────────────────────

  const setCurrentPage = useCallback((page: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page });
  }, []);

  const setTotalPages = useCallback((totalPages: number) => {
    dispatch({ type: "SET_TOTAL_PAGES", payload: totalPages });
  }, []);

  const setTotalAssets = useCallback((totalAssets: number) => {
    dispatch({ type: "SET_TOTAL_ASSETS", payload: totalAssets });
  }, []);

  // ─── Error & Sync Methods ─────────────────────────────────────────────────────

  const setErrorState = useCallback((error: { hasError: boolean; errorMessage: string }) => {
    dispatch({ type: "SET_ERROR_STATE", payload: error });
  }, []);

  const setSelectedType = useCallback((type: string) => {
    dispatch({ type: "SET_SELECTED_TYPE", payload: type });
  }, []);

  const updateAssets = useCallback(
    (newAssets: MediaAsset[]) => {
      setAssets(newAssets);
      if (newAssets.length === 0 && state.selectedAssets.size > 0) {
        selection.clearSelection();
      }
    },
    [state.selectedAssets.size, selection.clearSelection],
  );

  // ─── Context Value ─────────────────────────────────────────────────────────────

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      updateState,

      // From useMediaFilters
      ...filters,

      // From useMediaSelection
      ...selection,

      // Missing functions for MediaSelectionWrapperUnified
      assets,
      setSelectedType,

      // Upload methods
      uploadFiles,
      clearUploadProgress,
      setSyncStatus,

      // Sync methods
      updateAssets,

      // Modal methods
      setSelectedAsset,
      setSelectedAssetIndex,
      setLightboxOpen,
      setEditModalOpen,
      setDeleteModalOpen,

      // Pagination methods
      setCurrentPage,
      setTotalPages,
      setTotalAssets,

      // Error methods
      setErrorState,
    }),
    [
      state,
      updateState,
      filters,
      selection,
      setSelectedType,
      uploadFiles,
      clearUploadProgress,
      updateAssets,
      setSelectedAsset,
      setSelectedAssetIndex,
      setLightboxOpen,
      setEditModalOpen,
      setDeleteModalOpen,
      setCurrentPage,
      setTotalPages,
      setTotalAssets,
      setErrorState,
      assets,
      setSyncStatus,
    ],
  );

  return (
    <MediaLibraryContext.Provider value={contextValue}>{children}</MediaLibraryContext.Provider>
  );
}

// ─── Hook Exports ──────────────────────────────────────────────────────────────

export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext);
  if (!context) {
    throw new Error("useMediaLibrary must be used within a MediaLibraryProvider");
  }
  return context;
}

// Export context for external components
export { MediaLibraryContext };

// Export types for external use
export type { MediaLibraryContextType };
