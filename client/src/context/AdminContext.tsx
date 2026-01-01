import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { getQueryClient } from "@/lib/queryClient";

interface AdminContextState {
  currentModule: string;
  isLoading: boolean;
  error: Error | null;
  sidebarOpen: boolean;
  queryParams: URLSearchParams;
  hasUnsavedChanges: boolean;
}

interface AdminContextValue extends AdminContextState {
  setCurrentModule: (module: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  refreshData: () => void;
  navigateWithState: (path: string, preserveParams?: boolean) => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<AdminContextState>(() => ({
    currentModule: location.pathname.split("/")[2] || "dashboard",
    isLoading: false,
    error: null,
    sidebarOpen: false,
    // SSR-safe: defer window access to client
    queryParams:
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams(),
    hasUnsavedChanges: false,
  }));

  const setCurrentModule = useCallback((module: string) => {
    setState((prev) => ({ ...prev, currentModule: module }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, sidebarOpen: open }));
  }, []);

  const setHasUnsavedChanges = useCallback((hasChanges: boolean) => {
    setState((prev) => ({ ...prev, hasUnsavedChanges: hasChanges }));
  }, []);

  const refreshData = useCallback(() => {
    // Invalidate all queries to refresh data
    getQueryClient().invalidateQueries();
  }, []);

  const navigateWithState = useCallback(
    (path: string, preserveParams = false) => {
      if (state.hasUnsavedChanges && typeof window !== "undefined") {
        const confirmLeave = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?",
        );
        if (!confirmLeave) return;
      }

      let finalPath = path;
      if (preserveParams && state.queryParams.toString()) {
        finalPath = `${path}?${state.queryParams.toString()}`;
      }

      navigate(finalPath);
      setCurrentModule(path.split("/")[2] || "dashboard");
    },
    [state.hasUnsavedChanges, state.queryParams, navigate, setCurrentModule],
  );

  const value = useMemo(
    () => ({
      ...state,
      setCurrentModule,
      setLoading,
      setError,
      setSidebarOpen,
      setHasUnsavedChanges,
      refreshData,
      navigateWithState,
    }),
    [
      state,
      setCurrentModule,
      setLoading,
      setError,
      setSidebarOpen,
      setHasUnsavedChanges,
      refreshData,
      navigateWithState,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return context;
}
