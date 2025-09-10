import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOnline: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isOnline: navigator.onLine,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });
    // Auto-retry when connection is restored
    if (this.state.hasError) {
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  private isNetworkError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('cf error') ||
      message.includes('web server is down') ||
      !this.state.isOnline
    );
  };

  public render() {
    if (this.state.hasError) {
      const isNetworkIssue = this.isNetworkError(this.state.error!);
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                {isNetworkIssue ? (
                  this.state.isOnline ? (
                    <Wifi className="w-8 h-8 text-destructive" />
                  ) : (
                    <WifiOff className="w-8 h-8 text-destructive" />
                  )
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                )}
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                {isNetworkIssue
                  ? this.state.isOnline
                    ? "Service Temporarily Unavailable"
                    : "You're Offline"
                  : "Something Went Wrong"
                }
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isNetworkIssue
                  ? this.state.isOnline
                    ? "Our servers are experiencing issues. We're working to restore service."
                    : "Please check your internet connection and try again."
                  : "An unexpected error occurred. Please try refreshing the page."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={this.handleRetry}
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
                disabled={!this.state.isOnline && isNetworkIssue}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isNetworkIssue && !this.state.isOnline ? "Waiting for Connection..." : "Try Again"}
              </Button>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-md text-sm">
                  <summary className="font-medium cursor-pointer text-muted-foreground">
                    Technical Details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}