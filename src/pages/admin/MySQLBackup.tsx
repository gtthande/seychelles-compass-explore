import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Download,
  Upload
} from 'lucide-react';
import { 
  isMySQLBackupEnabled, 
  getMySQLConfig, 
  testMySQLConnection, 
  syncAllTablesToMySQL,
  getSchemaDiff,
  type BackupStatus,
  type SchemaDiff
} from '@/lib/mysql-backup';

const MySQLBackup = () => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [schemaDiffs, setSchemaDiffs] = useState<SchemaDiff[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const checkEnabled = isMySQLBackupEnabled();
    const mysqlConfig = getMySQLConfig();
    setEnabled(checkEnabled);
    setConfig(mysqlConfig);
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testMySQLConnection();
      setConnectionStatus(result);
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      setConnectionStatus({
        success: false,
        message: error.message || 'Failed to test connection',
      });
      toast({
        title: "Error",
        description: "Failed to test MySQL connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await syncAllTablesToMySQL();
      setBackupStatus(result);
      toast({
        title: result.success ? "Backup Successful" : "Backup Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      setBackupStatus({
        success: false,
        message: error.message || 'Failed to sync tables',
        errors: [error.message],
      });
      toast({
        title: "Error",
        description: "Failed to sync tables to MySQL",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckSchema = async () => {
    setLoading(true);
    try {
      const diffs = await getSchemaDiff();
      setSchemaDiffs(diffs);
      if (diffs.length > 0) {
        toast({
          title: "Schema Differences Found",
          description: `Found ${diffs.length} table(s) with schema differences`,
          variant: "default",
        });
      } else {
        toast({
          title: "Schema Sync",
          description: "No schema differences found",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to check schema differences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            MySQL Backup
          </CardTitle>
          <CardDescription>
            MySQL backup is not enabled. Configure environment variables to enable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>To enable MySQL backup, set the following environment variables:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>VITE_ENABLE_MYSQL_BACKUP=true</code></li>
              <li><code>VITE_MYSQL_HOST</code> (e.g., localhost or your Hostinger host)</li>
              <li><code>VITE_MYSQL_PORT</code> (default: 3306)</li>
              <li><code>VITE_MYSQL_USER</code></li>
              <li><code>VITE_MYSQL_PASSWORD</code></li>
              <li><code>VITE_MYSQL_DATABASE</code> (default: icompass)</li>
              <li><code>VITE_MYSQL_SSL</code> (true/false, for remote connections)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            MySQL Backup Configuration
          </CardTitle>
          <CardDescription>
            Sync Supabase data to MySQL for backup purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Configuration</span>
              {config ? (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            {config && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Host: {config.host}:{config.port}</p>
                <p>Database: {config.database}</p>
                <p>User: {config.user}</p>
                <p>SSL: {config.ssl ? 'Enabled' : 'Disabled'}</p>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              {connectionStatus && (
                <Badge variant={connectionStatus.success ? "default" : "destructive"}>
                  {connectionStatus.success ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Failed
                    </>
                  )}
                </Badge>
              )}
            </div>
            {connectionStatus && (
              <p className="text-xs text-muted-foreground">{connectionStatus.message}</p>
            )}
            <Button
              onClick={handleTestConnection}
              disabled={testingConnection}
              variant="outline"
              size="sm"
            >
              {testingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSyncAll}
              disabled={syncing || !connectionStatus?.success}
              className="flex-1"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Sync All Tables
                </>
              )}
            </Button>
            <Button
              onClick={handleCheckSchema}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Schema
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Status */}
      {backupStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {backupStatus.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Last Backup Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{backupStatus.message}</p>
            {backupStatus.tablesBackedUp !== undefined && (
              <p className="text-xs text-muted-foreground">
                Tables backed up: {backupStatus.tablesBackedUp}
              </p>
            )}
            {backupStatus.recordsBackedUp !== undefined && (
              <p className="text-xs text-muted-foreground">
                Records backed up: {backupStatus.recordsBackedUp}
              </p>
            )}
            {backupStatus.errors && backupStatus.errors.length > 0 && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-xs">
                <p className="font-medium text-destructive mb-1">Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {backupStatus.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schema Differences */}
      {schemaDiffs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Schema Differences
            </CardTitle>
            <CardDescription>
              Tables with differences between Supabase and MySQL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schemaDiffs.map((diff, idx) => (
                <div key={idx} className="p-3 border rounded">
                  <p className="font-medium mb-2">{diff.table}</p>
                  {diff.missingColumns.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">Missing Columns:</p>
                      <ul className="list-disc list-inside text-xs">
                        {diff.missingColumns.map((col, colIdx) => (
                          <li key={colIdx}>{col}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diff.extraColumns.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">Extra Columns:</p>
                      <ul className="list-disc list-inside text-xs">
                        {diff.extraColumns.map((col, colIdx) => (
                          <li key={colIdx}>{col}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MySQLBackup;

