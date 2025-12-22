import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '../logger';

// Debounced search hook with caching
export function useDebouncedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  delay: number = 300
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Cache for search results to avoid re-filtering identical queries
  const [searchCache] = useState(new Map<string, T[]>());

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, delay]);

  // Filter items based on debounced query with caching
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    const cacheKey = `${debouncedQuery}-${items.length}`;
    
    // Check cache first
    if (searchCache.has(cacheKey)) {
      logger.debug('Search cache hit', { query: debouncedQuery });
      return searchCache.get(cacheKey)!;
    }

    const query = debouncedQuery.toLowerCase();
    const results = items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (Array.isArray(value)) {
          return value.some(v => 
            typeof v === 'string' && v && v.toLowerCase().includes(query)
          );
        }
        return false;
      });
    });

    // Cache results (limit cache size to prevent memory leaks)
    if (searchCache.size > 50) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey !== undefined) {
        searchCache.delete(firstKey);
      }
    }
    searchCache.set(cacheKey, results);

    logger.debug('Search completed', { 
      query: debouncedQuery, 
      totalItems: items.length, 
      filteredItems: results.length 
    });

    return results;
  }, [items, debouncedQuery, searchFields, searchCache]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    searchCache.clear();
    logger.debug('Search cache cleared');
  }, [searchCache]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    filteredItems,
    isSearching,
    clearSearch,
    clearCache,
    cacheSize: searchCache.size,
  };
}