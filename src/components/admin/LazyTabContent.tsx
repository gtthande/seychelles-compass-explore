import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface LazyTabContentProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onLoad?: () => Promise<void>;
  hasData?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const LazyTabContent: React.FC<LazyTabContentProps> = ({
  title,
  description,
  children,
  onLoad,
  hasData = false,
  error = null,
  onRetry
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(hasData);

  const handleLoad = async () => {
    if (hasLoaded || isLoading) return;
    
    setIsLoading(true);
    try {
      if (onLoad) {
        await onLoad();
      }
      setHasLoaded(true);
    } catch (err) {
      console.error('Error loading tab content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-destructive">Failed to load data: {error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Click the button below to load {title.toLowerCase()} data.
            </p>
            <Button onClick={handleLoad} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                `Load ${title}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default LazyTabContent;
