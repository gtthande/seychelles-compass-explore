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
        // Get business count
        const { count: businessCount } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get product count
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get review count
        const { count: reviewCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true });

        setCounters({
          businesses: businessCount || 0,
          products: productCount || 0,
          users: userCount || 0,
          reviews: reviewCount || 0,
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
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
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ) : (
            <span className="counter-number">{value.toLocaleString()}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Live count
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <CounterCard
        title="Active Businesses"
        value={counters.businesses}
        icon={Building2}
        color="text-blue-600"
      />
      <CounterCard
        title="Products Available"
        value={counters.products}
        icon={Package}
        color="text-green-600"
      />
      <CounterCard
        title="Registered Users"
        value={counters.users}
        icon={Users}
        color="text-purple-600"
      />
      <CounterCard
        title="Total Reviews"
        value={counters.reviews}
        icon={Star}
        color="text-yellow-600"
      />
    </div>
  );
};

export default LiveCounters;