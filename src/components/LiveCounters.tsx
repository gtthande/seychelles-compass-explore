import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, Users, Star } from "lucide-react";
import { useLiveCounters } from "@/hooks/useLiveCounters";

const LiveCounters = () => {
  const { counters, loading, error } = useLiveCounters();

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