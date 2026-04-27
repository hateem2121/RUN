import { useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { MediaLibraryAction, MediaLibraryState } from "../MediaLibraryContextEnhanced";

interface UseMediaFiltersParams {
  state: MediaLibraryState;
  dispatch: React.Dispatch<MediaLibraryAction>;
}

interface UseMediaFiltersReturn {
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
}

export function useMediaFilters({ state, dispatch }: UseMediaFiltersParams): UseMediaFiltersReturn {
  const debouncedSearch = useDebounce(state.searchTerm, 300);

  const updateFilter = useCallback(
    <K extends keyof MediaLibraryState>(key: K, value: MediaLibraryState[K]) => {
      if (key === "folderFilter") {
        dispatch({ type: "SET_FOLDER_FILTER", payload: value as string });
      } else if (key === "tagFilters") {
        dispatch({ type: "SET_TAG_FILTERS", payload: value as string[] });
      } else if (key === "dateRange") {
        dispatch({
          type: "SET_DATE_RANGE",
          payload: value as { from?: Date; to?: Date },
        });
      } else if (key === "sizeRange") {
        dispatch({
          type: "SET_SIZE_RANGE",
          payload: value as { min?: number | undefined; max?: number },
        });
      }
    },
    [dispatch],
  );

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, [dispatch]);

  const clearSearch = useCallback(() => {
    dispatch({ type: "SET_SEARCH_TERM", payload: "" });
  }, [dispatch]);

  const addTagFilter = useCallback(
    (tag: string) => {
      if (!state.tagFilters.includes(tag)) {
        dispatch({
          type: "SET_TAG_FILTERS",
          payload: [...state.tagFilters, tag],
        });
      }
    },
    [state.tagFilters, dispatch],
  );

  const removeTagFilter = useCallback(
    (tag: string) => {
      dispatch({
        type: "SET_TAG_FILTERS",
        payload: state.tagFilters.filter((t) => t !== tag),
      });
    },
    [state.tagFilters, dispatch],
  );

  const toggleSortOrder = useCallback(() => {
    dispatch({
      type: "SET_SORT_ORDER",
      payload: state.sortOrder === "asc" ? "desc" : "asc",
    });
  }, [state.sortOrder, dispatch]);

  const hasActiveFilters = useMemo(() => {
    return (
      state.searchTerm !== "" ||
      state.selectedType !== "all" ||
      state.folderFilter !== "" ||
      state.tagFilters.length > 0 ||
      !!state.dateRange.from ||
      !!state.dateRange.to ||
      state.sizeRange.min !== undefined ||
      state.sizeRange.max !== undefined ||
      state.sortBy !== "uploadedAt" ||
      state.sortOrder !== "desc"
    );
  }, [state]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.searchTerm) {
      count++;
    }
    if (state.selectedType !== "all") {
      count++;
    }
    if (state.folderFilter) {
      count++;
    }
    if (state.tagFilters.length > 0) {
      count++;
    }
    if (state.dateRange.from || state.dateRange.to) {
      count++;
    }
    if (state.sizeRange.min !== undefined || state.sizeRange.max !== undefined) {
      count++;
    }
    return count;
  }, [state]);

  const getQueryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    if (state.selectedType !== "all") {
      params.set("type", state.selectedType);
    }
    if (state.folderFilter) {
      params.set("folder", state.folderFilter);
    }
    if (state.tagFilters.length > 0) {
      params.set("tags", state.tagFilters.join(","));
    }
    if (state.dateRange.from) {
      params.set("dateFrom", state.dateRange.from.toISOString());
    }
    if (state.dateRange.to) {
      params.set("dateTo", state.dateRange.to.toISOString());
    }
    if (state.sizeRange.min !== undefined) {
      params.set("sizeMin", state.sizeRange.min.toString());
    }
    if (state.sizeRange.max !== undefined) {
      params.set("sizeMax", state.sizeRange.max.toString());
    }
    params.set("sortBy", state.sortBy);
    params.set("sortOrder", state.sortOrder);

    return params;
  }, [state, debouncedSearch]);

  return {
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
  };
}
