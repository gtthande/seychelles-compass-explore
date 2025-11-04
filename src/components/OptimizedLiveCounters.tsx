import React, { useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, Users, Star } from "lucide-react";
import { useLiveCounters } from "@/hooks/useLiveCounters";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

// Memoized CounterCard component to prevent unnecessary re-renders
const CounterCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  color = "text-primary",
  loading = false
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color?: string;
  loading?: boolean;
}) => (
  <Card className="hover:shadow-lg transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
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
));

CounterCard.displayName = 'CounterCard';

const OptimizedLiveCounters = () => {
  const { counters, loading, error } = useLiveCounters();
  const { markStart, markEnd } = usePerformanceMonitor('LiveCounters');

  // Mark the start of data processing
  useEffect(() => {
    markStart('Data Processing');
  }, [markStart]);

  // Memoize counter data to prevent unnecessary re-renders
  const counterData = useMemo(() => {
    markStart('Counter Data Memoization');
    
    if (loading) {
      markEnd('Counter Data Memoization');
      return [];
    }
    if (error) {
      markEnd('Counter Data Memoization');
      return [];
    }
    
    const data = [
      {
        title: "Verified Businesses",
        value: counters?.businesses || 0,
        icon: Building2,
        color: "text-blue-600"
      },
      {
        title: "Products Available",
        value: counters?.products || 0,
        icon: Package,
        color: "text-green-600"
      },
      {
        title: "Registered Users",
        value: counters?.users || 0,
        icon: Users,
        color: "text-purple-600"
      },
      {
        title: "Customer Reviews",
        value: counters?.reviews || 0,
        icon: Star,
        color: "text-yellow-600"
      }
    ];
    
    markEnd('Counter Data Memoization');
    markEnd('Data Processing');
    return data;
  }, [counters, loading, error, markStart, markEnd]);

  // Memoized grid layout to prevent re-renders
  const gridLayout = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {counterData.map((counter) => (
        <CounterCard
          key={counter.title}
          title={counter.title}
          value={counter.value}
          icon={counter.icon}
          color={counter.color}
          loading={loading}
        />
      ))}
    </div>
  ), [counterData, loading]);

  return gridLayout;
};

export default OptimizedLiveCounters;
