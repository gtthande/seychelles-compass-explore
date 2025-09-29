import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Users, Package, FolderOpen, Calendar, Image, CreditCard, Building, UserCog, Terminal, GitBranch } from "lucide-react";
import CategoryManager from "@/components/admin/CategoryManager";
import AppointmentManager from "@/components/admin/AppointmentManager";
import HeroSectionManager from "@/components/admin/HeroSectionManager";
import DataSeeder from "@/components/admin/DataSeeder";
import SettingsManager from "@/components/admin/SettingsManager";
import PaymentDashboard from "@/components/admin/PaymentDashboard";
import PaymentProviderManager from "@/components/admin/PaymentProviderManager";
import BusinessManager from "@/components/admin/BusinessManager";
import UserManager from "@/components/admin/UserManager";
import DevSyncPanel from "@/pages/admin/DevSyncPanel";
import CodeSync from "@/pages/admin/CodeSync";

const AdminPanel = () => {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
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
    if (!authLoading) {
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage categories, users, and system settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
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
        </TabsList>

        <TabsContent value="hero">
          <HeroSectionManager />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentManager />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="businesses">
          <BusinessManager />
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-6">
            <PaymentProviderManager />
            <PaymentDashboard />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManager />
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Oversight</CardTitle>
              <CardDescription>
                Review and manage all products across businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Product oversight functionality coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <SettingsManager />
            <DataSeeder />
          </div>
        </TabsContent>

        <TabsContent value="dev-sync">
          <DevSyncPanel />
        </TabsContent>

        <TabsContent value="code-sync">
          <CodeSync />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;