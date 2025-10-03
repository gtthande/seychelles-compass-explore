import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, GitBranch, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface HealthStatus {
  server: {
    status: string;
    uptime: number;
    memory: any;
  };
  supabase: {
    status: string;
    error: string | null;
  };
  git: {
    status: string;
    branch: string | null;
    lastCommit: string | null;
    error: string | null;
  };
  environment: {
    nodeEnv: string;
    hasSupabaseUrl: boolean;
    hasSupabaseAnonKey: boolean;
    hasGoogleMapsKey: boolean;
  };
}

const PerformanceMonitor: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/health');
      const data = await response.json();
      setHealth(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>Loading system health...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>Error loading health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={fetchHealth} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>System health and performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(health.server.status)}
            <span className="font-medium">Server</span>
          </div>
          {getStatusBadge(health.server.status)}
        </div>
        
        <div className="text-sm text-muted-foreground ml-6">
          <div>Uptime: {Math.floor(health.server.uptime / 60)} minutes</div>
          <div>Memory: {Math.round(health.server.memory.heapUsed / 1024 / 1024)}MB used</div>
        </div>

        {/* Supabase Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="font-medium">Supabase</span>
          </div>
          {getStatusBadge(health.supabase.status)}
        </div>
        
        {health.supabase.error && (
          <div className="text-sm text-red-500 ml-6">{health.supabase.error}</div>
        )}

        {/* Git Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <span className="font-medium">Git</span>
          </div>
          {getStatusBadge(health.git.status)}
        </div>
        
        {health.git.branch && (
          <div className="text-sm text-muted-foreground ml-6">
            <div>Branch: {health.git.branch}</div>
            <div>Last commit: {health.git.lastCommit}</div>
          </div>
        )}
        
        {health.git.error && (
          <div className="text-sm text-red-500 ml-6">{health.git.error}</div>
        )}

        {/* Environment */}
        <div className="pt-2 border-t">
          <div className="text-sm font-medium mb-2">Environment</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span>Supabase URL:</span>
              {health.environment.hasSupabaseUrl ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Google Maps:</span>
              {health.environment.hasGoogleMapsKey ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              )}
            </div>
          </div>
        </div>

        <Button onClick={fetchHealth} variant="outline" size="sm" className="w-full">
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
