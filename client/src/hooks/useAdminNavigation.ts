import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { getQueryClient } from '@/lib/queryClient';

export function useAdminNavigation() {
  const [location, setLocation] = useLocation();

  const navigateToAdmin = useCallback((module?: string) => {
    const path = module ? `/admin/${module}` : '/admin';
    setLocation(path);
  }, [setLocation]);

  const refreshCurrentPage = useCallback(() => {
    // Invalidate all queries to force data refresh
    getQueryClient().invalidateQueries();
    
    // Force a re-render by navigating to a temp path and back
    const currentLocation = location;
    setLocation('/temp');
    setTimeout(() => setLocation(currentLocation), 0);
  }, [location, setLocation]);

  const navigateWithParams = useCallback((path: string, params?: Record<string, string>) => {
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      setLocation(`${path}?${queryString}`);
    } else {
      setLocation(path);
    }
  }, [setLocation]);

  const getCurrentModule = useCallback(() => {
    const pathSegments = location.split('/');
    return pathSegments[2] || 'dashboard';
  }, [location]);

  const isActiveModule = useCallback((module: string) => {
    const currentModule = getCurrentModule();
    return currentModule === module;
  }, [getCurrentModule]);

  const preserveQueryParams = useCallback((targetPath: string) => {
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.toString()) {
      return `${targetPath}?${currentParams.toString()}`;
    }
    return targetPath;
  }, []);

  return {
    location,
    navigateToAdmin,
    refreshCurrentPage,
    navigateWithParams,
    getCurrentModule,
    isActiveModule,
    preserveQueryParams,
    setLocation
  };
}