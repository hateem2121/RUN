import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { MediaLibraryAction, MediaLibraryState } from "../MediaLibraryContextEnhanced";

// Action map for dispatching URL-driven updates
const ACTION_MAP: Record<string, string> = {
  searchTerm: "SET_SEARCH_TERM",
  selectedType: "SET_SELECTED_TYPE",
  folderFilter: "SET_FOLDER_FILTER",
  tagFilters: "SET_TAG_FILTERS",
  dateRange: "SET_DATE_RANGE",
  sizeRange: "SET_SIZE_RANGE",
  sortBy: "SET_SORT_BY",
  sortOrder: "SET_SORT_ORDER",
  currentPage: "SET_CURRENT_PAGE",
};

interface UseMediaUrlSyncParams {
  state: MediaLibraryState;
  dispatch: React.Dispatch<MediaLibraryAction>;
}

export function useMediaUrlSync({ state, dispatch }: UseMediaUrlSyncParams): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to parse URL parameters and create state updates
  const parseUrlParamsToUpdates = useCallback(
    (
      params: URLSearchParams,
      currentState: MediaLibraryState,
    ): Array<{ key: keyof MediaLibraryState; value: unknown }> => {
      const updates: Array<{ key: keyof MediaLibraryState; value: unknown }> = [];

      if (params.has("search")) {
        updates.push({ key: "searchTerm", value: params.get("search") || "" });
      }
      if (params.has("type")) {
        updates.push({
          key: "selectedType",
          value: params.get("type") || "all",
        });
      }
      if (params.has("folder")) {
        updates.push({
          key: "folderFilter",
          value: params.get("folder") || "",
        });
      }
      if (params.has("tags")) {
        updates.push({
          key: "tagFilters",
          value: params.get("tags")?.split(",") || [],
        });
      }
      if (params.has("dateFrom")) {
        updates.push({
          key: "dateRange",
          value: {
            ...currentState.dateRange,
            from: new Date(params.get("dateFrom")!),
          },
        });
      }
      if (params.has("dateTo")) {
        updates.push({
          key: "dateRange",
          value: {
            ...currentState.dateRange,
            to: new Date(params.get("dateTo")!),
          },
        });
      }
      if (params.has("sizeMin")) {
        updates.push({
          key: "sizeRange",
          value: {
            ...currentState.sizeRange,
            min: Number(params.get("sizeMin")),
          },
        });
      }
      if (params.has("sizeMax")) {
        updates.push({
          key: "sizeRange",
          value: {
            ...currentState.sizeRange,
            max: Number(params.get("sizeMax")),
          },
        });
      }
      if (params.has("sortBy")) {
        const sortBy = params.get("sortBy");
        if (["name", "size", "uploadedAt", "type"].includes(sortBy as string)) {
          updates.push({ key: "sortBy", value: sortBy });
        }
      }
      if (params.has("sortOrder")) {
        const sortOrder = params.get("sortOrder");
        if (["asc", "desc"].includes(sortOrder as string)) {
          updates.push({
            key: "sortOrder",
            value: sortOrder,
          });
        }
      }
      if (params.has("page")) {
        updates.push({ key: "currentPage", value: Number(params.get("page")) });
      }

      return updates;
    },
    [],
  );

  // Initialize state from URL on mount
  useEffect(() => {
    const params = searchParams;

    const updates = parseUrlParamsToUpdates(params, state);

    if (updates.length > 0) {
      for (const { key, value } of updates) {
        if (ACTION_MAP[key]) {
          const type = ACTION_MAP[key];
          dispatch({ type, payload: value } as MediaLibraryAction);
        }
      }
    }

    setIsInitialized(true);
  }, [parseUrlParamsToUpdates, state, searchParams, dispatch]);

  // Sync state to URL
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const params = new URLSearchParams();

    if (state.searchTerm) {
      params.set("search", state.searchTerm);
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
    if (state.sortBy !== "uploadedAt") {
      params.set("sortBy", state.sortBy);
    }
    if (state.sortOrder !== "desc") {
      params.set("sortOrder", state.sortOrder);
    }
    if (state.currentPage > 1) {
      params.set("page", state.currentPage.toString());
    }

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();

    if (newSearch !== currentSearch) {
      setSearchParams(params);
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
    searchParams,
    setSearchParams,
  ]);
}
