import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, RefreshCw, Home } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle email verification callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          setStatus('success');
          toast({
            title: "Email verified successfully!",
            description: "Welcome to iCompass. Setting up your profile...",
          });

          // Check if user has a business profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, is_business_owner')
            .eq('id', data.session.user.id)  // Fixed: use id (primary key) not user_id
            .single();

          if (profile) {
            // Check if user has a business
            const { data: business } = await supabase
              .from('businesses')
              .select('id')
              .eq('owner_id', profile.id)
              .single();

            if (business) {
              // User has a business, redirect to dashboard
              setTimeout(() => navigate('/dashboard'), 2000);
            } else {
              // User doesn't have a business, redirect to onboarding
              setTimeout(() => navigate('/onboarding'), 2000);
            }
          } else {
            // No profile exists yet, redirect to onboarding
            setTimeout(() => navigate('/onboarding'), 2000);
          }
        } else {
          setStatus('error');
          setErrorMessage('No session found. Please try signing up again.');
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setStatus('error');
        setErrorMessage(error.message || 'An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'Verifying your email...';
      case 'success':
        return 'Email verified successfully! Redirecting...';
      case 'error':
        return 'Verification failed';
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage('');
    // Retry the auth callback
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl font-bold">
            {getStatusMessage()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {errorMessage}
              </p>
              <div className="space-y-2">
                <p className="text-sm">Possible reasons:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Email verification link has expired</li>
                  <li>• Link has already been used</li>
                  <li>• Invalid verification token</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => navigate('/auth')} 
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Go to Sign In
                </Button>
                <Button 
                  onClick={handleGoHome}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          )}
          {status === 'success' && (
            <p className="text-muted-foreground text-sm">
              You will be redirected shortly...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;