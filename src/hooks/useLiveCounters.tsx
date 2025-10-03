import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Performance profiling utility
const perfLog = (label: string, startTime?: number) => {
  if (startTime) {
    const duration = performance.now() - startTime;
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
    if (duration > 1000) {
      console.warn(`🐌 SLOW OPERATION: ${label} took ${duration.toFixed(2)}ms`);
    }
  } else {
    console.log(`🚀 Starting: ${label}`);
    return performance.now();
  }
};

interface CounterData {
  businesses: number;
  products: number;
  users: number;
  reviews: number;
}

export const useLiveCounters = () => {
  console.log('📊 useLiveCounters hook initializing...');
  
  const [counters, setCounters] = useState<CounterData>({
    businesses: 0,
    products: 0,
    users: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    const queryStartTime = perfLog('LiveCounters fetchCounts start');
    try {
      setError(null);
      setLoading(true);
      
      // Use the new database function for accurate counts
      const rpcStartTime = perfLog('LiveCounters RPC call start');
      const { data, error } = await supabase.rpc('get_live_counters');
      perfLog('LiveCounters RPC call completed', rpcStartTime);

      if (error) {
        console.error('RPC Error:', error);
        // Fallback to individual queries if RPC fails - optimized for performance
        const fallbackStartTime = perfLog('LiveCounters fallback queries start');
        
        // Use parallel queries for better performance
        const [businessesResult, productsResult, usersResult, reviewsResult] = await Promise.all([
          supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('reviews').select('id', { count: 'exact', head: true })
        ]);
        
        perfLog('LiveCounters fallback queries completed', fallbackStartTime);

        const businesses = businessesResult.count || 0;
        const products = productsResult.count || 0;
        const users = usersResult.count || 0;
        const reviews = reviewsResult.count || 0;

        setCounters({ businesses, products, users, reviews });
        return;
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
      console.error('Error fetching counts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch counters');
      // Set to fallback values on error to handle gracefully
      setCounters({
        businesses: 0,
        products: 0,
        users: 0,
        reviews: 0,
      });
    } finally {
      setLoading(false);
      perfLog('LiveCounters fetchCounts completed', queryStartTime);
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
      supabase.removeChannel(businessChannel);
      supabase.removeChannel(productChannel);
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