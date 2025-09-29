import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Upload, 
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Shield,
  GitBranch,
  GitCommit,
  DatabaseZap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SyncLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'running' | 'success' | 'error';
  message: string;
  output?: string;
}

const CodeSync: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Redirect if not admin
  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the Code & DB Sync panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/admin">
                Return to Admin Panel
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addLog = (action: string, status: SyncLog['status'], message: string, output?: string) => {
    const newLog: SyncLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      action,
      status,
      message,
      output
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const executeSync = async (action: string, endpoint: string) => {
    setIsLoading(prev => ({ ...prev, [action]: true }));
    addLog(action, 'running', `Starting ${action}...`);

    try {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/sync/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        addLog(action, 'success', `${action} completed successfully`, result.output);
        toast({
          title: 'Success',
          description: `${action} completed successfully`,
        });
      } else {
        addLog(action, 'error', `${action} failed: ${result.error}`, result.output);
        toast({
          title: 'Error',
          description: `${action} failed: ${result.error}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      addLog(action, 'error', `${action} failed: ${error.message}`);
      toast({
        title: 'Error',
        description: `${action} failed: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const getStatusIcon = (status: SyncLog['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: SyncLog['status']) => {
    const variants = {
      running: 'default',
      success: 'default',
      error: 'destructive'
    } as const;

    const colors = {
      running: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Code & DB Sync</h1>
        <p className="text-muted-foreground">
          Manage code synchronization and database migrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Sync Operations
            </CardTitle>
            <CardDescription>
              Execute Git operations and database migrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pull from GitHub */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Pull from GitHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pull latest changes from the main branch
              </p>
              <Button
                onClick={() => executeSync('Pull from GitHub', 'pull')}
                disabled={isLoading['Pull from GitHub']}
                className="w-full"
                variant="outline"
              >
                {isLoading['Pull from GitHub'] ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Pulling...
                  </>
                ) : (
                  <>
                    <GitBranch className="w-4 h-4 mr-2" />
                    Pull from GitHub
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Push to GitHub */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-500" />
                <span className="font-medium">Push to GitHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add, commit, and push all changes to main branch
              </p>
              <Button
                onClick={() => executeSync('Push to GitHub', 'push')}
                disabled={isLoading['Push to GitHub']}
                className="w-full"
                variant="outline"
              >
                {isLoading['Push to GitHub'] ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <GitCommit className="w-4 h-4 mr-2" />
                    Push to GitHub
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Database Migrations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Database Migrations</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Deploy pending database migrations
              </p>
              <Button
                onClick={() => executeSync('Database Migrations', 'db')}
                disabled={isLoading['Database Migrations']}
                className="w-full"
                variant="outline"
              >
                {isLoading['Database Migrations'] ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <DatabaseZap className="w-4 h-4 mr-2" />
                    Deploy Migrations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Operation Logs
            </CardTitle>
            <CardDescription>
              View the output of sync operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No sync operations yet. Click a button above to start.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">{log.action}</span>
                          {getStatusBadge(log.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                      
                      {log.output && (
                        <div className="bg-muted p-2 rounded text-xs font-mono">
                          <pre className="whitespace-pre-wrap">{log.output}</pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CodeSync;
