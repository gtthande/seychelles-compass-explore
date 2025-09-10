import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

export const MaintenanceBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { isFullyConnected, forceRetry, retryCount } = useConnectionStatus();

  if (isFullyConnected || isDismissed) {
    return null;
  }

  return (
    <Alert className="border-destructive/50 bg-destructive/10 text-destructive-foreground sticky top-0 z-50 rounded-none">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="flex-1">
          {retryCount > 3 
            ? "Extended maintenance in progress. Some features may be temporarily unavailable."
            : "Connection issues detected. Trying to reconnect..."
          }
        </span>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={forceRetry}
            className="h-6 px-2 border-destructive/20 hover:bg-destructive/20"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-6 w-6 p-0 hover:bg-destructive/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};