import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { business, loading: businessLoading, hasBusiness } = useBusinessAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && !businessLoading && user && !hasBusiness) {
      navigate('/onboarding');
      return;
    }
  }, [user, authLoading, businessLoading, hasBusiness, navigate]);

  if (authLoading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || !hasBusiness) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Business Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Manage your business profile and listings.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Business Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {business?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    business?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : business?.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {business?.status?.charAt(0).toUpperCase() + business?.status?.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="text-sm font-medium">{business?.category}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Island:</span>
                  <span className="text-sm font-medium">{business?.island}</span>
                </div>

                {business?.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-yellow-800">
                      Your business registration is pending approval. You'll receive an email once it's reviewed.
                    </p>
                  </div>
                )}

                {business?.status === 'active' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-green-800">
                      Your business is live on the iCompass directory!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">View Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Browse the complete business directory
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/directory')}
                  className="w-full"
                >
                  Open Directory
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  View your complete business information
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span> {business?.phone}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {business?.email}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span> {business?.address}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {business?.description}
              </p>
              
              {business?.services && business.services.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Services:</h4>
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((service, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;