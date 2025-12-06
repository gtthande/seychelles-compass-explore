import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Terminal
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

const DevSyncPanel: React.FC = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [allowSync, setAllowSync] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if ALLOW_SYNC is enabled
    const checkSyncPermission = async () => {
      try {
        const response = await fetch('http://localhost:5055/api/sync/health');
        if (response.ok) {
          setAllowSync(true);
        }
      } catch (error) {
        console.log('Sync server not available or ALLOW_SYNC not enabled');
        setAllowSync(false);
      }
    };
    checkSyncPermission();
  }, []);

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
      const response = await fetch(`http://localhost:3001/api/sync/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: `Dev Sync: ${action}` })
      });

      const data = await response.json();

      if (data.success) {
        addLog(action, 'success', data.message, data.output);
        toast({
          title: "Sync Success",
          description: data.message,
        });
      } else {
        addLog(action, 'error', data.message, data.error);
        toast({
          title: "Sync Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(action, 'error', `Failed to execute ${action}`, errorMessage);
      toast({
        title: "Sync Error",
        description: `Failed to execute ${action}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const handlePull = () => executeSync('Pull from GitHub', 'pull');
  const handlePush = () => executeSync('Push to GitHub', 'push');
  const handleSyncUI = () => executeSync('Sync UI', 'sync-ui');
  const handleMigrate = () => executeSync('Push DB Migrations', 'migrate');

  const getStatusIcon = (status: SyncLog['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: SyncLog['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return null;
    }
  };

  if (!allowSync) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dev Sync Panel</h1>
          <p className="text-muted-foreground">
            Dev Sync functionality is not available
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🔒</div>
              <h3 className="text-xl font-semibold">Sync Not Available</h3>
              <p className="text-muted-foreground">
                To enable Dev Sync functionality, set ALLOW_SYNC=1 in your environment variables
                and ensure the sync server is running.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dev Sync Panel</h1>
        <p className="text-muted-foreground">
          Manage code synchronization and database migrations
        </p>
      </div>

      {/* Sync Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Sync Operations
          </CardTitle>
          <CardDescription>
            Execute git operations and database migrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pull from GitHub */}
            <Button
              onClick={handlePull}
              disabled={isLoading.pull}
              className="h-16 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-5 h-5 mr-2" />
              {isLoading.pull ? 'Pulling...' : '↓ Pull from GitHub'}
            </Button>

            {/* Push to GitHub */}
            <Button
              onClick={handlePush}
              disabled={isLoading.push}
              className="h-16 bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload className="w-5 h-5 mr-2" />
              {isLoading.push ? 'Pushing...' : '↑ Push to GitHub'}
            </Button>

            {/* Sync UI */}
            <Button
              onClick={handleSyncUI}
              disabled={isLoading['sync-ui']}
              className="h-16 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              {isLoading['sync-ui'] ? 'Syncing...' : 'Sync UI'}
            </Button>

            {/* Push DB Migrations */}
            <Button
              onClick={handleMigrate}
              disabled={isLoading.migrate}
              className="h-16 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Database className="w-5 h-5 mr-2" />
              {isLoading.migrate ? 'Migrating...' : '⇄ Push DB Migrations'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Sync Logs
          </CardTitle>
          <CardDescription>
            Real-time output from sync operations
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
  );
};

export default DevSyncPanel;
