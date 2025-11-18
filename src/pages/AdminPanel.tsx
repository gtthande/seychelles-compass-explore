import React, { useState, useEffect, useCallback } from "react";
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
import { Shield, Settings, Users, Package, FolderOpen, Calendar, Image, CreditCard, Building, UserCog, Terminal, GitBranch, Activity, Database } from "lucide-react";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

// Lazy load heavy admin components
const CategoryManager = lazy(() => import("@/components/admin/CategoryManager"));
const HeroSectionManager = lazy(() => import("@/components/admin/HeroSectionManager"));
const DevSyncPanel = lazy(() => import("@/pages/admin/DevSyncPanel"));
const CodeSync = lazy(() => import("@/pages/admin/CodeSync"));
const LazyTabContent = lazy(() => import("@/components/admin/LazyTabContent"));
const OptimizedUserManager = lazy(() => import("@/components/admin/OptimizedUserManager"));
const OptimizedBusinessManager = lazy(() => import("@/components/admin/OptimizedBusinessManager"));
const ProductManager = lazy(() => import("@/components/admin/ProductManager"));
const PerformanceMonitor = lazy(() => import("@/components/PerformanceMonitor"));
const MySQLBackup = lazy(() => import("@/pages/admin/MySQLBackup"));
import PendingCountBadge from "@/components/admin/PendingCountBadge";

const AdminPanel = () => {
  // All hooks must be called unconditionally at top level
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine default tab based on URL
  const getDefaultTab = () => {
    if (location.pathname === '/admin/settings') {
      return 'settings';
    }
    return 'hero';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === 'settings') {
      navigate('/admin/settings');
    } else {
      navigate('/admin');
    }
  }, [navigate]);

  // RouteGuard handles all auth/loading checks, so by the time we reach here:
  // - User is authenticated
  // - Profile exists and is loaded
  // - User has admin role
  // If any of these fail, RouteGuard will redirect or show error

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
        <TabsList className="grid w-full grid-cols-12">
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
          <TabsTrigger value="businesses" className="flex items-center gap-2 relative">
            <Building className="w-4 h-4" />
            Businesses
            <PendingCountBadge className="ml-1" />
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
          <TabsTrigger value="mysql-backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            MySQL Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Suspense fallback={<LoadingSkeleton />}>
            <HeroSectionManager />
          </Suspense>
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
          <Suspense fallback={<LoadingSkeleton />}>
            <CategoryManager />
          </Suspense>
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
            <Suspense fallback={<LoadingSkeleton />}>
              <OptimizedBusinessManager />
            </Suspense>
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
            <Suspense fallback={<LoadingSkeleton />}>
              <OptimizedUserManager />
            </Suspense>
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
            <Suspense fallback={<LoadingSkeleton />}>
              <ProductManager />
            </Suspense>
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
          <Suspense fallback={<LoadingSkeleton />}>
            <DevSyncPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="code-sync">
          <Suspense fallback={<LoadingSkeleton />}>
            <CodeSync />
          </Suspense>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <PerformanceMonitor />
            </Suspense>
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

        <TabsContent value="mysql-backup">
          <Suspense fallback={<LoadingSkeleton />}>
            <MySQLBackup />
          </Suspense>
        </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default AdminPanel;