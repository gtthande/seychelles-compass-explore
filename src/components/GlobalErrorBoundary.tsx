import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 GlobalErrorBoundary caught an error:', error, errorInfo);
    console.error('🔍 Error ID:', this.state.errorId);
    console.error('📍 Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to console for debugging
    console.group('🚨 React Error Boundary');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    console.groupEnd();
  }

  handleRetry = () => {
    console.log('🔄 Retrying application...');
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: Math.random().toString(36).substr(2, 9)
    });
  };

  handleGoHome = () => {
    console.log('🏠 Navigating to homepage...');
    window.location.href = '/';
  };

  handleReload = () => {
    console.log('🔄 Reloading page...');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Application Error</CardTitle>
              <CardDescription className="text-lg">
                The application encountered an unexpected error and couldn't continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Details */}
              {this.state.error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <div className="flex items-center mb-2">
                    <Bug className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-800">Error Details:</span>
                  </div>
                  <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                    {this.state.error.message}
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}

              {/* Stack Trace */}
              {this.state.errorInfo && (
                <details className="rounded-md bg-gray-50 p-4 border">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    🔍 Show Technical Details
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-600">Component Stack:</span>
                      <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                    {this.state.error?.stack && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Error Stack:</span>
                        <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
                <Button onClick={this.handleReload} variant="secondary" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Debug Info */}
              <div className="text-xs text-gray-500 text-center">
                If this error persists, please check the browser console for more details.
                <br />
                Error ID: {this.state.errorId}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

