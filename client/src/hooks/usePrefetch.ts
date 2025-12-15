import { useEffect } from 'react';
import { getQueryClient } from '@/lib/queryClient';

interface PrefetchOptions {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
  staleTime?: number;
}

export function usePrefetch(options: PrefetchOptions[]) {
  useEffect(() => {
    options.forEach(({ queryKey, queryFn, staleTime = 5 * 60 * 1000 }) => {
      getQueryClient().prefetchQuery({
        queryKey,
        queryFn,
        staleTime
      });
    });
  }, []);
}

export function usePrefetchAdminData() {
  usePrefetch([
    {
      queryKey: ['/api/categories'],
      queryFn: async () => {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
      }
    },
    {
      queryKey: ['/api/fabrics'],
      queryFn: async () => {
        const res = await fetch('/api/fabrics');
        if (!res.ok) throw new Error('Failed to fetch fabrics');
        return res.json();
      }
    },
    {
      queryKey: ['/api/fibers'],
      queryFn: async () => {
        const res = await fetch('/api/fibers');
        if (!res.ok) throw new Error('Failed to fetch fibers');
        return res.json();
      }
    },
    {
      queryKey: ['/api/certificates'],
      queryFn: async () => {
        const res = await fetch('/api/certificates');
        if (!res.ok) throw new Error('Failed to fetch certificates');
        return res.json();
      }
    },
    {
      queryKey: ['/api/size-charts'],
      queryFn: async () => {
        const res = await fetch('/api/size-charts');
        if (!res.ok) throw new Error('Failed to fetch size charts');
        return res.json();
      }
    }
  ]);
}