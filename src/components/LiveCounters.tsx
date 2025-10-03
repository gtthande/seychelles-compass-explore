import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, Users, Star } from "lucide-react";
import { useLiveCounters } from "@/hooks/useLiveCounters";

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

const LiveCounters = () => {
  const componentStartTime = perfLog('LiveCounters component start');
  const { counters, loading, error } = useLiveCounters();

  console.log('LiveCounters:', { counters, loading, error });

  useEffect(() => {
    perfLog('LiveCounters data loaded', componentStartTime);
  }, [loading, counters]);

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