import React, { createContext, useContext, useReducer, useCallback, ReactNode, useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useLocation } from 'wouter';
import type { MediaAsset } from '@shared/schema';
import { MediaQueryKeys, invalidateMediaQueries } from '@/lib/media-query-keys';

// Type aliases for union types to reduce complexity
type UploadStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// Consolidated State Interface - Includes all functionality from hooks
export interface MediaLibraryState {
  // Core Display & Navigation (8 properties)
  searchTerm: string;
  selectedType: string;
  selectedAssets: Set<number>;
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'uploadedAt' | 'type';
  sortOrder: 'asc' | 'desc';
  showFiltersPanel: boolean;

  // Advanced Filters (from useMediaFilters) - (4 properties)
  folderFilter: string;
  tagFilters: string[];
  dateRange: { from?: Date; to?: Date };
  sizeRange: { min?: number; max?: number };

  // Modal State (3 properties)
  selectedAsset: MediaAsset | null;
  selectedAssetIndex: number;
  lightboxOpen: boolean;
  editModalOpen: boolean;
  deleteModalOpen: boolean;

  // Upload State (from useMediaUpload) - (3 properties)
  uploadProgress: Record<string, {
    progress: number;
    status: UploadStatus;
    error?: string;
  }>;
  isUploading: boolean;
  syncStatus: SyncStatus;

  // Pagination State (3 properties)
  currentPage: number;
  totalPages: number;
  totalAssets: number;

  // Error Handling (1 property)
  errorState: {
    hasError: boolean;
    errorMessage: string;
  };
}

// Consolidated Actions
type MediaLibraryAction =
  // Basic filters
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SELECTED_TYPE'; payload: string }
  | { type: 'SET_SELECTED_ASSETS'; payload: Set<number> }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_SORT_BY'; payload: 'name' | 'size' | 'uploadedAt' | 'type' }
  | { type: 'SET_SORT_ORDER'; payload: 'asc' | 'desc' }
  | { type: 'SET_SHOW_FILTERS_PANEL'; payload: boolean }

  // Advanced filters
  | { type: 'SET_FOLDER_FILTER'; payload: string }
  | { type: 'SET_TAG_FILTERS'; payload: string[] }
  | { type: 'SET_DATE_RANGE'; payload: { from?: Date; to?: Date } }
  | { type: 'SET_SIZE_RANGE'; payload: { min?: number; max?: number } }

  // Modal actions
  | { type: 'SET_SELECTED_ASSET'; payload: MediaAsset | null }
  | { type: 'SET_SELECTED_ASSET_INDEX'; payload: number }
  | { type: 'SET_LIGHTBOX_OPEN'; payload: boolean }
  | { type: 'SET_EDIT_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_DELETE_MODAL_OPEN'; payload: boolean }

  // Upload actions
  | { type: 'SET_UPLOAD_PROGRESS'; payload: Record<string, { progress: number; status: UploadStatus; error?: string; }> }
  | { type: 'SET_IS_UPLOADING'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }

  // Pagination actions
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_TOTAL_PAGES'; payload: number }
  | { type: 'SET_TOTAL_ASSETS'; payload: number }

  // Error actions
  | { type: 'SET_ERROR_STATE'; payload: { hasError: boolean; errorMessage: string; } }
  | { type: 'RESET_STATE' };

const initialState: MediaLibraryState = {
  // Core functionality
  searchTerm: '',
  selectedType: 'all',
  selectedAssets: new Set(),
  viewMode: 'grid',
  sortBy: 'uploadedAt',
  sortOrder: 'desc',
  showFiltersPanel: true,

  // Advanced filters
  folderFilter: '',
  tagFilters: [],
  dateRange: {},
  sizeRange: {},

  // Modal state
  selectedAsset: null,
  selectedAssetIndex: 0,
  lightboxOpen: false,
  editModalOpen: false,
  deleteModalOpen: false,

  // Upload state
  uploadProgress: {},
  isUploading: false,
  syncStatus: 'idle',

  // Pagination state
  currentPage: 1,
  totalPages: 1,
  totalAssets: 0,

  // Error handling
  errorState: {
    hasError: false,
    errorMessage: ''
  }
};

function mediaLibraryReducer(state: MediaLibraryState, action: MediaLibraryAction): MediaLibraryState {
  switch (action.type) {
    // Basic filters
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_SELECTED_TYPE':
      return { ...state, selectedType: action.payload };
    case 'SET_SELECTED_ASSETS':
      return { ...state, selectedAssets: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };
    case 'SET_SORT_ORDER':
      return { ...state, sortOrder: action.payload };
    case 'SET_SHOW_FILTERS_PANEL':
      return { ...state, showFiltersPanel: action.payload };

    // Advanced filters
    case 'SET_FOLDER_FILTER':
      return { ...state, folderFilter: action.payload };
    case 'SET_TAG_FILTERS':
      return { ...state, tagFilters: action.payload };
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    case 'SET_SIZE_RANGE':
      return { ...state, sizeRange: action.payload };

    // Modal actions
    case 'SET_SELECTED_ASSET':
      return { ...state, selectedAsset: action.payload };
    case 'SET_SELECTED_ASSET_INDEX':
      return { ...state, selectedAssetIndex: action.payload };
    case 'SET_LIGHTBOX_OPEN':
      return { ...state, lightboxOpen: action.payload };
    case 'SET_EDIT_MODAL_OPEN':
      return { ...state, editModalOpen: action.payload };
    case 'SET_DELETE_MODAL_OPEN':
      return { ...state, deleteModalOpen: action.payload };

    // Upload actions
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.payload };
    case 'SET_IS_UPLOADING':
      return { ...state, isUploading: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };

    // Pagination actions
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
    case 'SET_TOTAL_ASSETS':
      return { ...state, totalAssets: action.payload };

    // Error actions
    case 'SET_ERROR_STATE':
      return { ...state, errorState: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Consolidated Context Type - All functionality from three hooks
interface MediaLibraryContextType {
  state: MediaLibraryState;
  dispatch: React.Dispatch<MediaLibraryAction>;

  // Consolidated state updater (replaces 6 individual setters)
  updateState: <K extends keyof MediaLibraryState>(key: K, value: MediaLibraryState[K]) => void;

  // Advanced filter methods (from useMediaFilters)
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

  // Simplified selection methods (reduced from 8 to 4 functions)
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
  assets: MediaAsset[];  // Expose assets array for direct access
  selectAssets: (assetIds: number[]) => void;
  setSelectedType: (type: string) => void;

  // Upload methods (from useMediaUpload)
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
  setErrorState: (error: { hasError: boolean; errorMessage: string; }) => void;

  // PRIORITY 2 FIX: Asset synchronization method
  updateAssets: (newAssets: MediaAsset[]) => void;
}

const MediaLibraryContext = createContext<MediaLibraryContextType | null>(null);

export function MediaLibraryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(mediaLibraryReducer, initialState);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // PRIORITY 2 FIX: Get assets from React Query and sync with local state
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  // Get media data from ALL paginated queries using standardized keys
  useEffect(() => {
    // Use getQueriesData to find ALL media queries across all pages
    const allMediaQueries = queryClient.getQueriesData({
      queryKey: MediaQueryKeys.paginated
    });

    const allAssets: MediaAsset[] = [];

    console.log('🔧 MediaContext: Scanning for paginated media queries...');

    for (const [queryKey, queryData] of allMediaQueries) {
      const data = queryData as any;

      // Handle standard paginated response format
      if (data?.data && Array.isArray(data.data)) {
        console.log(`🔧 MediaContext: Found ${data.data.length} assets in query:`, queryKey);
        allAssets.push(...data.data);
      }
      // Handle alternative format
      else if (data?.success && Array.isArray(data.data)) {
        console.log(`🔧 MediaContext: Found ${data.data.length} assets (alt format) in query:`, queryKey);
        allAssets.push(...data.data);
      }
    }

    // Deduplicate by ID
    const uniqueAssets = Array.from(
      new Map(allAssets.map(asset => [asset.id, asset])).values()
    );

    if (uniqueAssets.length > 0) {
      console.log(`🔧 MediaContext: Loaded ${uniqueAssets.length} unique assets from ${allMediaQueries.length} queries`);
      setAssets(uniqueAssets);
    } else {
      console.log('🔧 MediaContext: No cached media found, assets will be empty until MediaGrid loads');
      setAssets([]);
    }
  }, [queryClient, state.currentPage]); // Re-run when page changes to catch new queries

  // Debounced search
  const debouncedSearch = useDebounce(state.searchTerm, 300);

  // Consolidated action creator - single function instead of 6 separate ones
  const updateState = useCallback(<K extends keyof MediaLibraryState>(
    key: K,
    value: MediaLibraryState[K]
  ) => {
    const actionMap = {
      searchTerm: 'SET_SEARCH_TERM',
      selectedType: 'SET_SELECTED_TYPE',
      selectedAssets: 'SET_SELECTED_ASSETS',
      viewMode: 'SET_VIEW_MODE',
      sortBy: 'SET_SORT_BY',
      sortOrder: 'SET_SORT_ORDER',
      showFiltersPanel: 'SET_SHOW_FILTERS_PANEL',
      folderFilter: 'SET_FOLDER_FILTER',
      tagFilters: 'SET_TAG_FILTERS',
      dateRange: 'SET_DATE_RANGE',
      sizeRange: 'SET_SIZE_RANGE',
      selectedAsset: 'SET_SELECTED_ASSET',
      selectedAssetIndex: 'SET_SELECTED_ASSET_INDEX',
      lightboxOpen: 'SET_LIGHTBOX_OPEN',
      editModalOpen: 'SET_EDIT_MODAL_OPEN',
      deleteModalOpen: 'SET_DELETE_MODAL_OPEN',
      uploadProgress: 'SET_UPLOAD_PROGRESS',
      isUploading: 'SET_IS_UPLOADING',
      syncStatus: 'SET_SYNC_STATUS',
      currentPage: 'SET_CURRENT_PAGE',
      totalPages: 'SET_TOTAL_PAGES',
      totalAssets: 'SET_TOTAL_ASSETS',
      errorState: 'SET_ERROR_STATE'
    } as const;

    const actionType = actionMap[key as keyof typeof actionMap];
    if (actionType) {
      dispatch({ type: actionType as any, payload: value });
    } else {
      console.warn(`UpdateState: No action mapping found for key "${String(key)}"`);
    }
  }, []);

  // Advanced filter methods (from useMediaFilters)
  const updateFilter = useCallback(<K extends keyof MediaLibraryState>(
    key: K,
    value: MediaLibraryState[K]
  ) => {
    if (key === 'folderFilter') {
      dispatch({ type: 'SET_FOLDER_FILTER', payload: value as string });
    } else if (key === 'tagFilters') {
      dispatch({ type: 'SET_TAG_FILTERS', payload: value as string[] });
    } else if (key === 'dateRange') {
      dispatch({ type: 'SET_DATE_RANGE', payload: value as { from?: Date; to?: Date } });
    } else if (key === 'sizeRange') {
      dispatch({ type: 'SET_SIZE_RANGE', payload: value as { min?: number; max?: number } });
    }
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const clearSearch = useCallback(() => {
    updateState('searchTerm', '');
  }, [updateState]);

  const addTagFilter = useCallback((tag: string) => {
    if (!state.tagFilters.includes(tag)) {
      dispatch({ type: 'SET_TAG_FILTERS', payload: [...state.tagFilters, tag] });
    }
  }, [state.tagFilters]);

  const removeTagFilter = useCallback((tag: string) => {
    dispatch({ type: 'SET_TAG_FILTERS', payload: state.tagFilters.filter(t => t !== tag) });
  }, [state.tagFilters]);

  const toggleSortOrder = useCallback(() => {
    updateState('sortOrder', state.sortOrder === 'asc' ? 'desc' : 'asc');
  }, [state.sortOrder, updateState]);

  // Filter calculations
  const hasActiveFilters = useMemo(() => {
    return (
      state.searchTerm !== '' ||
      state.selectedType !== 'all' ||
      state.folderFilter !== '' ||
      state.tagFilters.length > 0 ||
      !!state.dateRange.from ||
      !!state.dateRange.to ||
      state.sizeRange.min !== undefined ||
      state.sizeRange.max !== undefined ||
      state.sortBy !== 'uploadedAt' ||
      state.sortOrder !== 'desc'
    );
  }, [state]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.searchTerm) count++;
    if (state.selectedType !== 'all') count++;
    if (state.folderFilter) count++;
    if (state.tagFilters.length > 0) count++;
    if (state.dateRange.from || state.dateRange.to) count++;
    if (state.sizeRange.min !== undefined || state.sizeRange.max !== undefined) count++;
    return count;
  }, [state]);

  const getQueryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (state.selectedType !== 'all') params.set('type', state.selectedType);
    if (state.folderFilter) params.set('folder', state.folderFilter);
    if (state.tagFilters.length > 0) params.set('tags', state.tagFilters.join(','));
    if (state.dateRange.from) params.set('dateFrom', state.dateRange.from.toISOString());
    if (state.dateRange.to) params.set('dateTo', state.dateRange.to.toISOString());
    if (state.sizeRange.min !== undefined) params.set('sizeMin', state.sizeRange.min.toString());
    if (state.sizeRange.max !== undefined) params.set('sizeMax', state.sizeRange.max.toString());
    params.set('sortBy', state.sortBy);
    params.set('sortOrder', state.sortOrder);

    return params;
  }, [state, debouncedSearch]);

  // Simplified selection methods - consolidated from 8 functions to 3
  const toggleAsset = useCallback((assetId: number) => {
    const newSelectedAssets = new Set(state.selectedAssets);
    if (newSelectedAssets.has(assetId)) {
      newSelectedAssets.delete(assetId);
    } else {
      newSelectedAssets.add(assetId);
    }
    dispatch({ type: 'SET_SELECTED_ASSETS', payload: newSelectedAssets });
  }, [state.selectedAssets]);

  const selectAll = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_ASSETS', payload: new Set(assets.map(asset => asset.id)) });
  }, [assets]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_ASSETS', payload: new Set() });
  }, []);

  const isSelected = useCallback((assetId: number) => state.selectedAssets.has(assetId), [state.selectedAssets]);

  // Missing functions needed by MediaSelectionWrapperUnified
  const selectAssets = useCallback((assetIds: number[]) => {
    dispatch({ type: 'SET_SELECTED_ASSETS', payload: new Set(assetIds) });
  }, []);

  const setSelectedType = useCallback((type: string) => {
    dispatch({ type: 'SET_SELECTED_TYPE', payload: type });
  }, []);

  // Simplified selection data - combined calculations
  const selectionData = useMemo(() => {
    const selected = assets.filter(asset => state.selectedAssets.has(asset.id));
    const totalSize = selected.reduce((sum, asset) => sum + (asset.size || 0), 0);
    const typeCount = selected.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      count: selected.length,
      totalSize,
      typeCount,
      isEmpty: selected.length === 0,
      isAll: selected.length === assets.length,
      isPartial: selected.length > 0 && selected.length < assets.length
    };
  }, [assets, state.selectedAssets]);

  // Upload methods (from useMediaUpload) - Simplified version
  const uploadMutation = useMutation({
    mutationFn: async (params: { files: FileList | File[]; onProgress?: (progress: number) => void }) => {
      const { files } = params;
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('file', file);
      }

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: async () => {
      // SIMPLIFIED: Single invalidation strategy to prevent 429 rate limit errors
      // Instead of multiple simultaneous cache resets and refetches, use a single
      // controlled invalidation with a small delay to allow the backend to process

      try {
        // Show success toast immediately for better UX
        toast({
          title: "Upload Complete",
          description: "Files uploaded successfully",
        });

        // Clear upload state
        dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: {} });
        dispatch({ type: 'SET_IS_UPLOADING', payload: false });

        // Wait a moment before invalidating to let the upload transaction complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Single invalidation - this will trigger ONE refetch of active queries
        await invalidateMediaQueries(queryClient);

      } catch (error) {
        console.warn('[MediaLibraryContext] Post-upload refresh error:', error);
        // Even if invalidation fails, the upload succeeded, so don't show error
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: "destructive",
      });
      dispatch({ type: 'SET_IS_UPLOADING', payload: false });
    }
  });

  const uploadFiles = useCallback(async (files: FileList | File[]): Promise<void> => {
    if (files.length === 0) return;

    dispatch({ type: 'SET_IS_UPLOADING', payload: true });
    const fileArray = Array.from(files);

    // Initialize progress tracking
    const initialProgress: Record<string, { progress: number; status: UploadStatus; error?: string; }> = {};
    for (let index = 0; index < fileArray.length; index++) {
      initialProgress[`file-${index}`] = {
        progress: 0,
        status: 'pending'
      };
    }
    dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: initialProgress });

    try {
      await uploadMutation.mutateAsync({ files });
    } catch (error) {
      console.error('[MediaLibraryContext] Upload error:', error);
      // Error handling is done in mutation
    }
  }, [uploadMutation]);

  const clearUploadProgress = useCallback((): void => {
    dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: {} });
  }, []);

  const setSyncStatus = useCallback((status: SyncStatus): void => {
    dispatch({ type: 'SET_SYNC_STATUS', payload: status });
  }, []);

  // Modal methods
  const setSelectedAsset = useCallback((asset: MediaAsset | null) => {
    dispatch({ type: 'SET_SELECTED_ASSET', payload: asset });
  }, []);

  const setLightboxOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_LIGHTBOX_OPEN', payload: open });
  }, []);

  const setEditModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_EDIT_MODAL_OPEN', payload: open });
  }, []);

  // Pagination methods
  const setCurrentPage = useCallback((page: number) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PAGINATION CLICK DETECTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔹 Previous Page:', state.currentPage);
    console.log('🔹 New Page:', page);
    console.log('🔹 Total Pages:', state.totalPages);
    console.log('🔹 Timestamp:', new Date().toISOString());
    console.log('🔹 Action: Dispatching SET_CURRENT_PAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });

    console.log('✅ Page state updated - query should refetch');
  }, [state.currentPage, state.totalPages]);

  const setTotalPages = useCallback((totalPages: number) => {
    dispatch({ type: 'SET_TOTAL_PAGES', payload: totalPages });
  }, []);

  const setTotalAssets = useCallback((totalAssets: number) => {
    dispatch({ type: 'SET_TOTAL_ASSETS', payload: totalAssets });
  }, []);

  // Error methods
  const setErrorState = useCallback((error: { hasError: boolean; errorMessage: string; }) => {
    dispatch({ type: 'SET_ERROR_STATE', payload: error });
  }, []);

  // Missing modal methods that components expect
  const setSelectedAssetIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_SELECTED_ASSET_INDEX', payload: index });
  }, []);

  const setDeleteModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_DELETE_MODAL_OPEN', payload: open });
  }, []);

  // PRIORITY 2 FIX: Add updateAssets method for external sync
  const updateAssets = useCallback((newAssets: MediaAsset[]) => {

    setAssets(newAssets);

    // Clear selection if assets change dramatically
    if (newAssets.length === 0 && state.selectedAssets.size > 0) {
      clearSelection();
    }

  }, [assets.length, state.selectedAssets.size, clearSelection]);

  // Context value
  const contextValue = useMemo(() => ({
    state,
    dispatch,

    // Basic filters (consolidated into updateState)
    updateState,

    // Advanced filter methods
    updateFilter,
    resetFilters,
    clearSearch,
    addTagFilter,
    removeTagFilter,
    toggleSortOrder,
    hasActiveFilters,
    activeFilterCount,
    getQueryParams,
    debouncedSearch,

    // Selection methods (simplified from 8 to 4 functions)
    selectionData,
    toggleAsset,
    selectAll,
    clearSelection,
    isSelected,

    // Missing functions for MediaSelectionWrapperUnified
    assets,  // Expose assets for MediaSelectionWrapperUnified
    selectAssets,
    setSelectedType,

    // Upload methods
    uploadFiles,
    clearUploadProgress,
    setSyncStatus,

    // PRIORITY 2 FIX: Sync methods
    updateAssets, // PRIORITY 2 FIX: Expose updateAssets method

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
  }), [
    state,
    updateState,
    updateFilter,
    resetFilters,
    clearSearch,
    addTagFilter,
    removeTagFilter,
    toggleSortOrder,
    hasActiveFilters,
    activeFilterCount,
    getQueryParams,
    debouncedSearch,
    selectionData,
    toggleAsset,
    selectAll,
    clearSelection,
    isSelected,
    selectAssets,
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
  ]);

  // URL Synchronization
  const [location, setLocation] = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to parse URL parameters and create state updates
  const parseUrlParamsToUpdates = (
    params: URLSearchParams,
    currentState: MediaLibraryState
  ): Array<{ key: keyof MediaLibraryState; value: any }> => {
    const updates: Array<{ key: keyof MediaLibraryState; value: any }> = [];

    if (params.has('search')) {
      updates.push({ key: 'searchTerm', value: params.get('search') || '' });
    }
    if (params.has('type')) {
      updates.push({ key: 'selectedType', value: params.get('type') || 'all' });
    }
    if (params.has('folder')) {
      updates.push({ key: 'folderFilter', value: params.get('folder') || '' });
    }
    if (params.has('tags')) {
      updates.push({ key: 'tagFilters', value: params.get('tags')?.split(',') || [] });
    }
    if (params.has('dateFrom')) {
      updates.push({
        key: 'dateRange',
        value: { ...currentState.dateRange, from: new Date(params.get('dateFrom')!) }
      });
    }
    if (params.has('dateTo')) {
      updates.push({
        key: 'dateRange',
        value: { ...currentState.dateRange, to: new Date(params.get('dateTo')!) }
      });
    }
    if (params.has('sizeMin')) {
      updates.push({
        key: 'sizeRange',
        value: { ...currentState.sizeRange, min: Number(params.get('sizeMin')) }
      });
    }
    if (params.has('sizeMax')) {
      updates.push({
        key: 'sizeRange',
        value: { ...currentState.sizeRange, max: Number(params.get('sizeMax')) }
      });
    }
    if (params.has('sortBy')) {
      updates.push({ key: 'sortBy', value: params.get('sortBy') as any });
    }
    if (params.has('sortOrder')) {
      updates.push({ key: 'sortOrder', value: params.get('sortOrder') as any });
    }
    if (params.has('page')) {
      updates.push({ key: 'currentPage', value: Number(params.get('page')) });
    }

    return updates;
  };

  // Action map for dispatching updates
  const ACTION_MAP: Record<string, string> = {
    searchTerm: 'SET_SEARCH_TERM',
    selectedType: 'SET_SELECTED_TYPE',
    folderFilter: 'SET_FOLDER_FILTER',
    tagFilters: 'SET_TAG_FILTERS',
    dateRange: 'SET_DATE_RANGE',
    sizeRange: 'SET_SIZE_RANGE',
    sortBy: 'SET_SORT_BY',
    sortOrder: 'SET_SORT_ORDER',
    currentPage: 'SET_CURRENT_PAGE'
  };

  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);

    // Parse URL params into state updates
    const updates = parseUrlParamsToUpdates(params, state);

    if (updates.length > 0) {
      for (const { key, value } of updates) {
        if (ACTION_MAP[key]) {
          dispatch({ type: ACTION_MAP[key] as any, payload: value });
        }
      }
    }

    setIsInitialized(true);
  }, []);

  // Sync state to URL
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();

    if (state.searchTerm) params.set('search', state.searchTerm);
    if (state.selectedType !== 'all') params.set('type', state.selectedType);
    if (state.folderFilter) params.set('folder', state.folderFilter);
    if (state.tagFilters.length > 0) params.set('tags', state.tagFilters.join(','));
    if (state.dateRange.from) params.set('dateFrom', state.dateRange.from.toISOString());
    if (state.dateRange.to) params.set('dateTo', state.dateRange.to.toISOString());
    if (state.sizeRange.min !== undefined) params.set('sizeMin', state.sizeRange.min.toString());
    if (state.sizeRange.max !== undefined) params.set('sizeMax', state.sizeRange.max.toString());
    if (state.sortBy !== 'uploadedAt') params.set('sortBy', state.sortBy);
    if (state.sortOrder !== 'desc') params.set('sortOrder', state.sortOrder);
    if (state.currentPage > 1) params.set('page', state.currentPage.toString());

    const newSearch = params.toString();
    const currentSearch = globalThis.location.search.substring(1); // Remove '?'

    if (newSearch !== currentSearch) {
      // Use replace to avoid cluttering history stack for every filter change, 
      // or push if you want back button support. 
      // Usually for filters/pagination, push is better for UX.
      // wouter's setLocation defaults to push.
      setLocation(location + (newSearch ? '?' + newSearch : ''));
    }
  }, [
    state.searchTerm,
    state.selectedType,
    state.folderFilter,
    state.tagFilters,
    state.dateRange,
    state.sizeRange,
    state.sortBy,
    state.sortOrder,
    state.currentPage,
    isInitialized,
    location,
    setLocation
  ]);

  return (
    <MediaLibraryContext.Provider value={contextValue}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext);
  if (!context) {
    throw new Error('useMediaLibrary must be used within a MediaLibraryProvider');
  }
  return context;
}

// Backward compatibility alias (remove after updating all imports)
export const useMediaLibraryEnhanced = useMediaLibrary;
export const MediaLibraryEnhancedProvider = MediaLibraryProvider;

// Export context for external components that need the consolidated functionality
export { MediaLibraryContext };

// Export types for external use
export type { MediaLibraryContextType };