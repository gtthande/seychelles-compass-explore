/**
 * Data Loader Utility for React Applications
 * Provides optimized data fetching patterns similar to Next.js getStaticProps/getServerSideProps
 */

import { supabase } from '@/integrations/supabase/client';

// Cache for static data
const staticDataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds
const CACHE_TTL = {
  STATIC: 5 * 60 * 1000, // 5 minutes for static content
  DYNAMIC: 1 * 60 * 1000, // 1 minute for dynamic content
  USER_SPECIFIC: 30 * 1000, // 30 seconds for user-specific content
};

export interface DataLoaderOptions {
  cache?: boolean;
  ttl?: number;
  revalidate?: boolean;
  fallback?: any;
}

export interface StaticDataResult<T> {
  data: T;
  error?: string;
  cached?: boolean;
  timestamp: number;
}

export interface DynamicDataResult<T> {
  data: T;
  error?: string;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Load static data (similar to getStaticProps)
 * Use for data that doesn't change often and can be cached
 */
export async function loadStaticData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: DataLoaderOptions = {}
): Promise<StaticDataResult<T>> {
  const {
    cache = true,
    ttl = CACHE_TTL.STATIC,
    revalidate = false,
    fallback = null
  } = options;

  // Check cache first
  if (cache && !revalidate) {
    const cached = staticDataCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        data: cached.data,
        cached: true,
        timestamp: cached.timestamp
      };
    }
  }

  try {
    const data = await fetcher();

    // Cache the result
    if (cache) {
      staticDataCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
    }

    return {
      data,
      cached: false,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`🚨 DataLoader: Error loading static data for key "${key}":`, error);
    console.error('DataLoader Error type:', typeof error);
    console.error('DataLoader Error instanceof Error:', error instanceof Error);
    if (error instanceof Error) {
      console.error('DataLoader Error message:', error.message);
      console.error('DataLoader Error stack:', error.stack);
    }

    // Return cached data if available, otherwise fallback
    if (cache) {
      const cached = staticDataCache.get(key);
      if (cached) {
        console.log(`🔄 DataLoader: Using cached data for key "${key}" due to fetch error`);
        return {
          data: cached.data,
          cached: true,
          timestamp: cached.timestamp,
          error: 'Using cached data due to fetch error'
        };
      }
    }

    return {
      data: fallback,
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      timestamp: Date.now()
    };
  }
}

/**
 * Load dynamic data (similar to getServerSideProps)
 * Use for data that changes frequently or is user-specific
 */
export function useDynamicData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: DataLoaderOptions = {}
): DynamicDataResult<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const {
    cache = false,
    ttl = CACHE_TTL.DYNAMIC,
    fallback = null
  } = options;

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    // Check cache first if caching is enabled
    if (cache) {
      const cached = staticDataCache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await fetcher();
      setData(result);

      // Cache the result if caching is enabled
      if (cache) {
        staticDataCache.set(key, {
          data: result,
          timestamp: Date.now(),
          ttl
        });
      }
    } catch (err) {
      console.error(`🚨 DataLoader: Error loading dynamic data for key "${key}":`, err);
      console.error('DataLoader Dynamic Error type:', typeof err);
      console.error('DataLoader Dynamic Error instanceof Error:', err instanceof Error);
      if (err instanceof Error) {
        console.error('DataLoader Dynamic Error message:', err.message);
        console.error('DataLoader Dynamic Error stack:', err.stack);
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cache, ttl, fallback]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data: data as T,
    error: error || undefined,
    loading,
    refetch: loadData
  };
}

/**
 * Preload data for static pages
 * Call this before navigating to a page to prefetch data
 */
export async function preloadPageData(pageKey: string, fetchers: Record<string, () => Promise<any>>) {
  const promises = Object.entries(fetchers).map(([key, fetcher]) =>
    loadStaticData(`${pageKey}_${key}`, fetcher, { cache: true })
  );

  try {
    const results = await Promise.all(promises);
    return results.reduce((acc, result, index) => {
      const key = Object.keys(fetchers)[index];
      acc[key] = result.data;
      return acc;
    }, {} as Record<string, any>);
  } catch (error) {
    console.error(`Error preloading data for page "${pageKey}":`, error);
    return {};
  }
}

/**
 * Clear cache for specific key or all cache
 */
export function clearCache(key?: string) {
  if (key) {
    staticDataCache.delete(key);
  } else {
    staticDataCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(staticDataCache.entries());

  return {
    totalEntries: entries.length,
    validEntries: entries.filter(([, value]) => now - value.timestamp < value.ttl).length,
    expiredEntries: entries.filter(([, value]) => now - value.timestamp >= value.ttl).length,
    memoryUsage: JSON.stringify(Array.from(staticDataCache.values())).length
  };
}

// Common data fetchers for the application
export const dataFetchers = {
  // Static data fetchers
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          is_active
        `)
        .eq('is_active', true);

      if (error) {
        console.error('[DATA-LOADER] getCategories failed:', error);
        throw error;
      }

      console.log('[DATA-LOADER] getCategories successful:', data);
      return data || [];
    } catch (err) {
      console.error('[DATA-LOADER] getCategories exception:', err);
      throw err;
    }
  },

  async getFeaturedBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        category,
        status,
        phone,
        logo_url
      `)
      .eq('featured', true)
      .limit(6);

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }
    return data || [];
  },

  async getHeroSection() {
    const { data, error } = await supabase
      .from('hero_sections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  },

  async getLiveCounters() {
    try {
      const { data, error } = await supabase.rpc('get_live_counters');

      if (error) {
        console.error('🚨 DataFetchers: getLiveCounters RPC failed:', error);
        console.error('getLiveCounters Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ DataFetchers: getLiveCounters successful:', data);
      return data || { businesses: 0, products: 0, users: 0 };
    } catch (err) {
      console.error('🚨 DataFetchers: getLiveCounters exception:', err);
      throw err;
    }
  },

  // Dynamic data fetchers
  async getBusinesses(filters: any = {}) {
    let query = supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        category,
        status,
        phone,
        logo_url
      `)
      .limit(20);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }
    
    return data || [];
  },

  async getProducts(filters: any = {}) {
    try {
      // Use business_products with many-to-many join pattern
      let query = supabase
        .from('business_products')
        .select(`
          id,
          business_id,
          product_id,
          title_override,
          description_override,
          price_override,
          business:businesses (
            id,
            name,
            address,
            island,
            category,
            status
          ),
          product:products (
            id,
            title,
            description,
            image_url,
            price,
            duration,
            is_active,
            searchable,
            stock,
            slug,
            created_at,
            updated_at
          )
        `)
        .order('id', { ascending: true });

      // Apply filters
      // Category filter removed - products don't have category field
      if (filters.search) {
        query = query.or(`
          product.title.ilike.%${filters.search}%,
          product.description.ilike.%${filters.search}%,
          title_override.ilike.%${filters.search}%,
          description_override.ilike.%${filters.search}%
        `);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[DATA-LOADER] getProducts failed:', error);
        throw error;
      }

      // Transform to match expected format
      const results: any[] = (data || []).map((bp: any) => ({
        id: bp.product?.id || bp.id,
        title: bp.title_override || bp.product?.title || 'Unknown Product',
        description: bp.description_override || bp.product?.description || '',
        price: bp.price_override || bp.product?.price || null,
        image_url: bp.product?.image_url || null,
        stock: bp.product?.stock || 0,
        business_id: bp.business_id,
        created_at: bp.created_at || bp.product?.created_at,
      }));

      console.log('[DATA-LOADER] getProducts successful:', results.length, 'products');
      return results;
    } catch (error: any) {
      console.error('[getProducts] Unexpected error:', error);
      throw error;
    }
  },

  async getBusinessById(id: string) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          category,
          status,
          phone,
          logo_url
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[getBusinessById] Error:', error);
        return null;
      }
      return data;
    } catch (error: any) {
      console.error('[getBusinessById] Unexpected error:', error);
      return null;
    }
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)  // Fixed: use id (primary key) not user_id
      .single();

    if (error) throw error;
    return data;
  }
};

// Import React for hooks
import React from 'react';
