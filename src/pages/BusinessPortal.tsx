import React, { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

// Lazy load heavy business components
const BusinessRegistration = lazy(() => import("@/components/business/BusinessRegistration"));
const BusinessDashboard = lazy(() => import("@/components/business/BusinessDashboard"));

const BusinessPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const { business, loading: businessLoading, hasBusiness } = useBusinessAuth();

  if (authLoading || businessLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <Building2 className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle>Business Portal</CardTitle>
            <CardDescription>
              Please log in to access the business portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth">
                Log In
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasBusiness) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<LoadingSkeleton />}>
            <BusinessRegistration />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <BusinessDashboard />
        </Suspense>
      </div>
    </div>
  );
};

export default BusinessPortal;