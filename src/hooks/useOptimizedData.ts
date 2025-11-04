/**
 * Optimized Data Fetching Hooks
 * Provides React hooks for different data fetching patterns
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadStaticData, useDynamicData, dataFetchers, type DataLoaderOptions } from '@/lib/data-loader';

/**
 * Hook for static data that doesn't change often
 * Similar to getStaticProps in Next.js
 */
export function useStaticData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: DataLoaderOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadStaticData(key, fetcher, options);
      setData(result.data);
      setCached(result.cached || false);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(options.fallback || null);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    cached,
    refetch: loadData
  };
}

/**
 * Hook for dynamic data that changes frequently
 * Similar to getServerSideProps in Next.js
 */
export function useServerSideData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: DataLoaderOptions = {}
) {
  return useDynamicData(key, fetcher, {
    cache: false, // Don't cache dynamic data by default
    ...options
  });
}

/**
 * Hook for user-specific data
 * Automatically refetches when user changes
 */
export function useUserData<T>(
  key: string,
  fetcher: (userId: string) => Promise<T>,
  userId: string | null,
  options: DataLoaderOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(userId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(options.fallback || null);
    } finally {
      setLoading(false);
    }
  }, [userId, fetcher, options.fallback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch: loadData
  };
}

/**
 * Hook for paginated data
 * Handles loading states and pagination logic
 */
export function usePaginatedData<T>(
  key: string,
  fetcher: (page: number, limit: number, filters?: any) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  initialPage = 1,
  limit = 20,
  filters: any = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = useCallback(async (page: number, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(page, limit, filters);
      
      if (append) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetcher, limit, filters]);

  const loadNextPage = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(currentPage + 1, true);
    }
  }, [loadPage, currentPage, loading, hasMore]);

  const refresh = useCallback(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  return {
    data,
    loading,
    error,
    currentPage,
    total,
    hasMore,
    loadNextPage,
    refresh
  };
}

/**
 * Hook for real-time data with subscriptions
 * Automatically updates when data changes in the database
 */
export function useRealtimeData<T>(
  table: string,
  select: string = '*',
  filters: any = {},
  options: { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    let query = supabase
      .from(table)
      .select(select);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Initial fetch
    query.then(({ data: initialData, error: initialError }) => {
      if (initialError) {
        setError(initialError.message);
      } else {
        setData(initialData || []);
      }
      setLoading(false);
    });

    // Set up real-time subscription
    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table 
        }, 
        (payload) => {
          console.log('Real-time update:', payload);
          
          setData(prevData => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...prevData, payload.new as T];
              case 'UPDATE':
                return prevData.map(item => 
                  (item as any).id === payload.new.id ? payload.new as T : item
                );
              case 'DELETE':
                return prevData.filter(item => (item as any).id !== payload.old.id);
              default:
                return prevData;
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, select, enabled, JSON.stringify(filters)]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-fetch logic would go here
    }
  };
}

// Import supabase for real-time functionality
import { supabase } from '@/integrations/supabase/client';
