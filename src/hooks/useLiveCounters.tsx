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
      
      // Use the new database function for accurate counts
      const { data, error } = await supabase.rpc('get_live_counters', {}, {
        signal
      });

      if (error) {
        console.error('🚨 useLiveCounters: RPC get_live_counters failed:', error);
        console.error('RPC Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Fallback to individual queries if RPC fails - optimized for performance
        console.log('🔄 useLiveCounters: Falling back to individual queries...');
        try {
          const [businessesResult, productsResult] = await Promise.all([
            supabase.from('businesses').select('id', { count: 'exact', head: true }),
            supabase.from('business_products')
              .select('id', { count: 'exact', head: true })
          ]);

          if (businessesResult.error) {
            console.error('🚨 useLiveCounters: Businesses query error:', businessesResult.error);
          }
          if (productsResult.error) {
            console.error('🚨 useLiveCounters: Products query error:', productsResult.error);
          }

          const businesses = businessesResult.count || 0;
          const products = productsResult.count || 0;

          console.log('✅ useLiveCounters: Fallback queries successful:', { businesses, products });
          setCounters({ businesses, products, users: 0, reviews: 0 });
          return;
        } catch (fallbackError) {
          console.error('🚨 useLiveCounters: Fallback queries failed:', fallbackError);
          throw fallbackError;
        }
      }

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
    } catch (error) {
      // Don't set error if request was aborted
      if (signal.aborted) return;
      
      console.error('🚨 useLiveCounters: Exception caught:', error);
      console.error('Exception type:', typeof error);
      console.error('Exception instanceof Error:', error instanceof Error);
      if (error instanceof Error) {
        console.error('Exception message:', error.message);
        console.error('Exception stack:', error.stack);
      }
      
      setError(error instanceof Error ? error.message : 'Failed to fetch counters');
      // Set to fallback values on error to handle gracefully
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