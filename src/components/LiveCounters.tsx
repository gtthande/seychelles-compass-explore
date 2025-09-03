import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Package, Users, Star } from "lucide-react";

interface CounterData {
  businesses: number;
  products: number;
  users: number;
  reviews: number;
}

const LiveCounters = () => {
  const [counters, setCounters] = useState<CounterData>({
    businesses: 0,
    products: 0,
    users: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Use the new database function for accurate counts
        const { data, error } = await supabase.rpc('get_live_counters');

        if (error) throw error;

        if (data && data.length > 0) {
          const counters = data[0];
          setCounters({
            businesses: Number(counters.verified_businesses) || 0,
            products: Number(counters.active_products) || 0,
            users: Number(counters.total_users) || 0,
            reviews: Number(counters.total_reviews) || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
        // Set to zero on error to handle empty states gracefully
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

  const CounterCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "text-primary" 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color?: string; 
  }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 text-primary`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ) : value === 0 ? (
            <span className="counter-number text-muted-foreground">0</span>
          ) : (
            <span className="counter-number">{value.toLocaleString()}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {value === 0 ? "No data yet" : "Live count"}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <CounterCard
        title="Verified Businesses"
        value={counters.businesses}
        icon={Building2}
      />
      <CounterCard
        title="Products Available"
        value={counters.products}
        icon={Package}
      />
      <CounterCard
        title="Registered Users"
        value={counters.users}
        icon={Users}
      />
      <CounterCard
        title="Customer Reviews"
        value={counters.reviews}
        icon={Star}
      />
    </div>
  );
};

export default LiveCounters;