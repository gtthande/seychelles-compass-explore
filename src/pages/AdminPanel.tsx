import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Performance profiling utility
const perfLog = (label: string, startTime?: number) => {
  if (startTime) {
    const duration = performance.now() - startTime;
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
    if (duration > 1000) {
      console.warn(`🐌 SLOW OPERATION: ${label} took ${duration.toFixed(2)}ms`);
    }
  } else {
    console.log(`🚀 Starting: ${label}`);
    return performance.now();
  }
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Users, Package, FolderOpen, Calendar, Image, CreditCard, Building, UserCog, Terminal, GitBranch, Activity } from "lucide-react";
import CategoryManager from "@/components/admin/CategoryManager";
import HeroSectionManager from "@/components/admin/HeroSectionManager";
import DevSyncPanel from "@/pages/admin/DevSyncPanel";
import CodeSync from "@/pages/admin/CodeSync";
import LazyTabContent from "@/components/admin/LazyTabContent";
import OptimizedUserManager from "@/components/admin/OptimizedUserManager";
import OptimizedBusinessManager from "@/components/admin/OptimizedBusinessManager";
import ProductManager from "@/components/admin/ProductManager";
import ErrorBoundary from "@/components/ErrorBoundary";
import PerformanceMonitor from "@/components/PerformanceMonitor";

const AdminPanel = () => {
  const adminStartTime = perfLog('AdminPanel component start');
  console.log('🔍 AdminPanel: Component starting to render');
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  console.log('🔍 AdminPanel: Auth state:', { user: !!user, profile: !!profile, authLoading, isAdmin });
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Determine default tab based on URL
  const getDefaultTab = () => {
    if (location.pathname === '/admin/settings') {
      return 'settings';
    }
    return 'hero';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  useEffect(() => {
    const effectStartTime = perfLog('AdminPanel useEffect start');
    console.log('🔍 AdminPanel: useEffect triggered, authLoading:', authLoading);
    if (!authLoading) {
      console.log('🔍 AdminPanel: Setting loading to false');
      setLoading(false);
      perfLog('AdminPanel useEffect completed', effectStartTime);
    }
  }, [authLoading]);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'settings') {
      navigate('/admin/settings');
    } else {
      navigate('/admin');
    }
  };

  if (authLoading || loading) {
    console.log('🔍 AdminPanel: Showing loading state, authLoading:', authLoading, 'loading:', loading);
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
            <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>
              Please log in to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth">
                Log In
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/">
                Return Home
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 AdminPanel Error:', error);
        console.error('🚨 AdminPanel Error Info:', errorInfo);
        // Could send to error reporting service here
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage categories, users, and system settings
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="businesses" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Businesses
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="dev-sync" className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Dev Sync
          </TabsTrigger>
          <TabsTrigger value="code-sync" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Code & DB Sync
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroSectionManager />
        </TabsContent>

        <TabsContent value="appointments">
          <LazyTabContent
            title="Appointment Management"
            description="Manage appointments and bookings"
            onLoad={async () => {
              // Simulate loading appointments data
              await new Promise(resolve => setTimeout(resolve, 1000));
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Appointment Management</CardTitle>
                <CardDescription>
                  Manage appointments and bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Appointment management functionality will be loaded here.
                </p>
              </CardContent>
            </Card>
          </LazyTabContent>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="businesses">
          <LazyTabContent
            title="Business Management"
            description="Manage business listings and approvals"
            onLoad={async () => {
              // Business data will be loaded by the OptimizedBusinessManager component
              await new Promise(resolve => setTimeout(resolve, 500));
            }}
          >
            <OptimizedBusinessManager />
          </LazyTabContent>
        </TabsContent>

        <TabsContent value="payments">
          <LazyTabContent
            title="Payment Management"
            description="Manage payment providers and transactions"
            onLoad={async () => {
              // Simulate loading payment data
              await new Promise(resolve => setTimeout(resolve, 1000));
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>
                  Manage payment providers and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Payment management functionality will be loaded here.
                </p>
              </CardContent>
            </Card>
          </LazyTabContent>
        </TabsContent>

        <TabsContent value="users">
          <LazyTabContent
            title="User Management"
            description="Manage user accounts and permissions"
            onLoad={async () => {
              // User data will be loaded by the OptimizedUserManager component
              await new Promise(resolve => setTimeout(resolve, 500));
            }}
          >
            <OptimizedUserManager />
          </LazyTabContent>
        </TabsContent>

        <TabsContent value="products">
          <LazyTabContent
            title="Product Management"
            description="Manage product catalog and inventory"
            onLoad={async () => {
              // Product data will be loaded by the ProductManager component
              await new Promise(resolve => setTimeout(resolve, 500));
            }}
          >
            <ProductManager />
          </LazyTabContent>
        </TabsContent>

        <TabsContent value="settings">
          <LazyTabContent
            title="Settings Management"
            description="Manage application settings and configuration"
            onLoad={async () => {
              // Simulate loading settings data
              await new Promise(resolve => setTimeout(resolve, 1000));
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Settings Management</CardTitle>
                <CardDescription>
                  Manage application settings and configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Settings management functionality will be loaded here.
                </p>
              </CardContent>
            </Card>
          </LazyTabContent>
        </TabsContent>

        <TabsContent value="dev-sync">
          <DevSyncPanel />
        </TabsContent>

        <TabsContent value="code-sync">
          <CodeSync />
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceMonitor />
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <div className="font-medium">Bundle Size</div>
                    <div className="text-muted-foreground">Optimized with code splitting</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Loading Strategy</div>
                    <div className="text-muted-foreground">Lazy loading + Suspense</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Error Handling</div>
                    <div className="text-muted-foreground">Error boundaries + fallbacks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default AdminPanel;