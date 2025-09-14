import { useState, useEffect } from "react";
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

  const fetchCounts = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Use the new database function for accurate counts
      const { data, error } = await supabase.rpc('get_live_counters');

      if (error) {
        console.error('RPC Error:', error);
        // Fallback to individual queries if RPC fails
        const [businessesResult, productsResult, usersResult, reviewsResult] = await Promise.allSettled([
          supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('reviews').select('id', { count: 'exact', head: true })
        ]);

        const businesses = businessesResult.status === 'fulfilled' ? businessesResult.value.count || 0 : 0;
        const products = productsResult.status === 'fulfilled' ? productsResult.value.count || 0 : 0;
        const users = usersResult.status === 'fulfilled' ? usersResult.value.count || 0 : 0;
        const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.count || 0 : 0;

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