import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import { 
  Building2, 
  Package, 
  Settings, 
  Plus, 
  Eye, 
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";

import ProductList from "./ProductList";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  currency: string;
  is_active: boolean;
  stock: number;
  status: string;
  business_id: string | null;
  created_at: string;
  updated_at: string;
  slug?: string | null;
}

const BusinessDashboard = () => {
  const { business, loading } = useBusinessAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!business) return;

      try {
        // Use business_products join table instead of products.business_id
        const { data, error } = await supabase
          .from('business_products')
          .select(`
            id,
            title_override,
            description_override,
            price_override,
            is_active,
            created_at,
            updated_at,
            product:products!inner (
              id,
              title,
              description,
              image_url,
              price,
              duration,
              is_active,
              searchable,
              stock,
              slug
            )
          `)
          .eq('business_id', business.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform to match Product interface
        const transformedProducts = (data || []).map((bp: any) => ({
          id: bp.id,
          title: bp.title_override || bp.product?.title || 'Unknown Product',
          description: bp.description_override || bp.product?.description || null,
          image_url: bp.product?.image_url || null,
          price: bp.price_override || bp.product?.price || null,
          price_override: bp.price_override || null,
          is_active: bp.is_active,
          stock: bp.product?.stock || null,
          in_stock: bp.is_active,
          stock_quantity: bp.product?.stock || null,
          images: bp.product?.image_url ? [bp.product.image_url] : null,
          catalogue_url: bp.booking_url || null,
          sku: null,
          unit: null,
          tags: null,
          created_at: bp.created_at,
        }));
        
        setProducts(transformedProducts);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setProductsLoading(false);
      }
    };

    if (business) {
      fetchProducts();
    }
  }, [business, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
        <p className="text-muted-foreground">You don't have a business registered yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">{business.title}</h1>
          <Badge className={`${getStatusColor(business.is_active && business.is_verified ? 'active' : business.is_active ? 'pending' : 'inactive')} text-white`}>
            {business.is_active && business.is_verified ? 'Active' : business.is_active ? 'Pending' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-muted-foreground">{business.description}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products & Services</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{business.average_rating || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {business.total_reviews || 0} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Your business details as they appear to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {business.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a 
                          href={`tel:${business.phone}`} 
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          {business.phone}
                        </a>
                      </div>
                    )}
                    {business.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a 
                          href={`mailto:${business.email}`} 
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          {business.email}
                        </a>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          {business.website}
                        </a>
                      </div>
                    )}
                    {business.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {business.address}, {business.island}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Services</h4>
                  <div className="flex flex-wrap gap-1">
                    {business.services?.map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductList />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>Manage your business profile and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default BusinessDashboard;