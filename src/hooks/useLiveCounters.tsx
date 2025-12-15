import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CounterData {
  businesses: number;
  products: number;
  users: number;
  reviews: number;
}

export const useLiveCounters = () => {
  const [counters, setCounters] = useState<CounterData>({
    businesses: 0,
    products: 0,
    users: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Cache RPC failure - only attempt RPC once per session
  const rpcFailedRef = useRef<boolean>(false);

  const fetchCounts = async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      setError(null);
      setLoading(true);
      
      // Skip RPC if it failed previously - use fallback directly
      if (rpcFailedRef.current) {
        if (import.meta.env.DEV) {
          console.debug('[useLiveCounters] Skipping RPC (cached failure), using fallback directly');
        }
        // Use fallback queries directly
        try {
          const [businessesResult, productsResult] = await Promise.all([
            supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('products').select('id', { count: 'exact', head: true })
          ]);

          // Suppress individual query errors - log warnings only
          if (businessesResult.error && import.meta.env.DEV) {
            console.warn('[useLiveCounters] Businesses query warning:', businessesResult.error.message);
          }
          if (productsResult.error && import.meta.env.DEV) {
            console.warn('[useLiveCounters] Products query warning:', productsResult.error.message);
          }

          const businesses = businessesResult.count || 0;
          const products = productsResult.count || 0;

          if (import.meta.env.DEV) {
            console.debug('[useLiveCounters] Fallback queries completed:', { businesses, products });
          }
          setCounters({ businesses, products, users: 0, reviews: 0 });
          setLoading(false);
          return;
        } catch (fallbackError: any) {
          // Suppress error spam - log warning only
          if (import.meta.env.DEV) {
            console.warn('[useLiveCounters] Fallback queries failed:', fallbackError?.message || 'Unknown error');
          }
          // Set fallback values instead of throwing
          setCounters({ businesses: 0, products: 0, users: 0, reviews: 0 });
          setLoading(false);
          return;
        }
      }
      
      // Attempt RPC only if not previously failed
      // TODO: RPC 'get_live_counters' may not exist or have schema mismatches
      // FALLBACK: Uses direct table queries if RPC fails (non-fatal)
      const { data, error } = await supabase.rpc('get_live_counters', {}, {
        signal
      });

      if (error) {
        // Cache RPC failure - log warning ONCE
        // SAFETY: This error is expected and safe - fallback queries handle it
        rpcFailedRef.current = true;
        if (import.meta.env.DEV) {
          console.warn('[useLiveCounters] RPC get_live_counters failed (caching failure), using fallback:', error.message);
        }
        
        // FALLBACK: Individual queries if RPC fails - optimized for performance
        // This prevents blank screens and ensures counters always display
        try {
          const [businessesResult, productsResult] = await Promise.all([
            supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('products').select('id', { count: 'exact', head: true })
          ]);

          // Suppress individual query errors - log warnings only
          if (businessesResult.error && import.meta.env.DEV) {
            console.warn('[useLiveCounters] Businesses query warning:', businessesResult.error.message);
          }
          if (productsResult.error && import.meta.env.DEV) {
            console.warn('[useLiveCounters] Products query warning:', productsResult.error.message);
          }

          const businesses = businessesResult.count || 0;
          const products = productsResult.count || 0;

          if (import.meta.env.DEV) {
            console.debug('[useLiveCounters] Fallback queries completed:', { businesses, products });
          }
          setCounters({ businesses, products, users: 0, reviews: 0 });
          setLoading(false);
          return;
        } catch (fallbackError: any) {
          // Suppress error spam - log warning only
          if (import.meta.env.DEV) {
            console.warn('[useLiveCounters] Fallback queries failed:', fallbackError?.message || 'Unknown error');
          }
          // Set fallback values instead of throwing
          setCounters({ businesses: 0, products: 0, users: 0, reviews: 0 });
          setLoading(false);
          return;
        }
      }

      // RPC succeeded - reset failure flag
      rpcFailedRef.current = false;
      
      if (data && data.length > 0) {
        const counters = data[0];
        setCounters({
          businesses: Number(counters.verified_businesses) || 0,
          products: Number(counters.active_products) || 0,
          users: Number(counters.total_users) || 0,
          reviews: Number(counters.total_reviews) || 0,
        });
      } else {
        // No data returned, use fallback values
        setCounters({
          businesses: 0,
          products: 0,
          users: 0,
          reviews: 0,
        });
      }
      setLoading(false);
    } catch (error: any) {
      // SAFETY: Don't set error if request was aborted (component unmounted)
      if (signal.aborted) return;
      
      // SAFETY: Suppress error spam - log warning only once
      // This catch block ensures counters always have values, preventing blank screens
      if (import.meta.env.DEV) {
        console.warn('[useLiveCounters] Exception caught (non-critical):', error?.message || 'Unknown error');
      }
      
      // FALLBACK: Don't show error to user, handle gracefully with zero values
      setError(null);
      setCounters({
        businesses: 0,
        products: 0,
        users: 0,
        reviews: 0,
      });
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCounts();

    // Set up real-time subscriptions for live updates
    const businessChannel = supabase
      .channel('business-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
        fetchCounts();
      })
      .subscribe();

    const productChannel = supabase
      .channel('product-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchCounts();
      })
      .subscribe();

    const businessProductChannel = supabase
      .channel('business-product-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_products' }, () => {
        fetchCounts();
      })
      .subscribe();

    const profileChannel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchCounts();
      })
      .subscribe();

    const reviewChannel = supabase
      .channel('review-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clean up subscriptions
      supabase.removeChannel(businessChannel);
      supabase.removeChannel(productChannel);
      supabase.removeChannel(businessProductChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(reviewChannel);
    };
  }, []);

  return {
    counters,
    loading,
    error,
    refetch: fetchCounts,
  };
};