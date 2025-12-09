import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building, Package, Plus, Edit, Trash2, MapPin, Phone, Mail, Globe, Navigation, ShoppingCart } from "lucide-react";
import { geocodeAddress as geocodeAddressLib } from "@/lib/geocoding";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Business {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  categories?: { id: string; title: string; slug: string } | null;
  phone: string;
  email: string;
  website: string;
  address: string;
  island: string;
  latitude: number | null;
  longitude: number | null;
  owner_id: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  price_override: number | null;
  currency_code: string;
  is_active: boolean;
  stock: number | null;
  business_id: string | null;
  created_at: string;
  updated_at: string;
  slug?: string | null;
}

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);

  const [businessForm, setBusinessForm] = useState({
    name: "",
    description: "",
    category_id: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    island: "",
    latitude: null as number | null,
    longitude: null as number | null
  });

  // Debug form state changes
  useEffect(() => {
    console.log('🔍 BusinessForm state changed:', businessForm);
  }, [businessForm]);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    image_url: ""
  });

  useEffect(() => {
    if (user) {
      fetchBusiness();
      fetchProducts();
      fetchCategories();
    }
  }, [user]);

  // Removed automatic geolocation - users should manually select location

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, title, slug')
        .order('title');

      if (error) throw error;
      
      const categoryOptions = data?.map(cat => ({
        value: cat.id,
        label: cat.title
      })) || [];
      
      setCategories(categoryOptions);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const geocodeAddress = async (address: string) => {
    console.log('🔍 geocodeAddress called with:', address);
    console.log('🔍 Call stack:', new Error().stack);
    
    if (!address.trim()) {
      toast({
        title: 'Address Required',
        description: 'Please enter an address to get coordinates.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First try the Supabase function
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { 
          address: address,
          island: businessForm.island || 'Mahé'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data && data.latitude && data.longitude) {
        const updatedForm = {
          ...businessForm,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.formatted_address || address
        };
        
        setBusinessForm(updatedForm);
        
        // Auto-save to Supabase if business exists
        if (business?.id) {
          await autoSaveBusiness(updatedForm);
        }
        
        toast({
          title: 'Location Found & Saved',
          description: `Coordinates set: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
        });
        setIsLoading(false);
        return;
      }

      // Fallback to client-side geocoding
      console.log('Supabase function failed, trying client-side geocoding...');
      const result = await geocodeAddressLib(address, businessForm.island);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.latitude && result.longitude) {
        const updatedForm = {
          ...businessForm,
          latitude: result.latitude,
          longitude: result.longitude,
          address: result.formatted_address || address
        };
        
        setBusinessForm(updatedForm);
        
        // Auto-save to Supabase if business exists
        if (business?.id) {
          await autoSaveBusiness(updatedForm);
        }
        
        toast({
          title: 'Location Found & Saved',
          description: `Coordinates set: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
        });
        setIsLoading(false);
      } else {
        throw new Error('No coordinates returned');
      }
      
    } catch (error: any) {
      console.error('Error geocoding address:', error);
      
      // Final fallback to Seychelles center coordinates
      const seychellesCoords = {
        'Mahé': { lat: -4.6796, lng: 55.4920 },
        'Praslin': { lat: -4.3197, lng: 55.7370 },
        'La Digue': { lat: -4.3598, lng: 55.8275 }
      };

      const coords = seychellesCoords[businessForm.island as keyof typeof seychellesCoords] || seychellesCoords['Mahé'];
      
      const updatedForm = {
        ...businessForm,
        latitude: coords.lat,
        longitude: coords.lng
      };
      
      setBusinessForm(updatedForm);
      
      // Auto-save to Supabase if business exists
      if (business?.id) {
        await autoSaveBusiness(updatedForm);
      }
      
      toast({
        title: 'Using Default Location',
        description: `Set to ${businessForm.island || 'Mahé'} center coordinates. You can adjust manually.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const autoSaveBusiness = async (formData: any) => {
    if (!business?.id || !user) return;
    
    try {
      // Sync all coordinate fields - lat/lng are source of truth
      const lat = formData.latitude || formData.lat;
      const lng = formData.longitude || formData.lng;
      const coords = lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null;
      
      const { error } = await supabase
        .from('businesses')
        .update({
          lat: lat,
          lng: lng,
          location_lat: lat,
          location_lng: lng,
          coords: coords,
          latitude: lat, // Keep legacy field for compatibility
          longitude: lng, // Keep legacy field for compatibility
          address: formData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', business.id);

      if (error) {
        console.error('Auto-save error:', error);
        toast({
          title: 'Auto-save Failed',
          description: 'Location updated locally but failed to save to database.',
          variant: 'destructive',
        });
      } else {
        console.log('Business location auto-saved successfully');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const fetchBusiness = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          categories (id, name, slug)
        `)
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        console.log('🔍 Loading business data:', data);
        console.log('🔍 Existing coordinates:', data.latitude, data.longitude);
        setBusiness(data);
        setBusinessForm({
          name: data.name || "",
          description: data.description || "",
          category_id: data.category_id || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          address: data.address || "",
          island: data.island || "",
          latitude: data.latitude || null,
          longitude: data.longitude || null
        });
      } else {
        console.log('🔍 No existing business data found - starting with empty form');
      }
    } catch (error: any) {
      console.error('Error fetching business:', error);
      toast({
        title: "Error",
        description: "Failed to load business information.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    if (!user || !business?.id) return;

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
      // Transform business_products data to match expected Product interface
      const transformedProducts = (data || []).map((bp: any) => {
        const displayTitle = bp.title_override || bp.product?.title || 'Unknown Product';
        const displayDescription = bp.description_override || bp.product?.description || '';
        const displayPrice = bp.price_override || bp.product?.price || 0;
        return {
          id: bp.id,
          name: displayTitle,
          title: displayTitle,
          description: displayDescription,
          price: displayPrice,
          currency: 'SCR',
          category: '', // Category removed from products schema
          images: bp.product?.image_url ? [bp.product.image_url] : [],
          image_url: bp.product?.image_url || null,
          is_active: bp.is_active,
          stock: bp.product?.stock || 0,
          created_at: bp.created_at,
          updated_at: bp.updated_at,
        };
      });
      setProducts(transformedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async () => {
    if (!user) return;

    try {
      if (business) {
        // Update existing business
        const { error } = await supabase
          .from('businesses')
          .update(businessForm)
          .eq('id', business.id);

        if (error) throw error;
      } else {
        // Create new business
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            ...businessForm,
            owner_id: user.id,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        setBusiness(data);
      }

      toast({
        title: "Success",
        description: "Business information saved successfully.",
      });
      setIsBusinessDialogOpen(false);
      fetchBusiness();
    } catch (error: any) {
      console.error('Error saving business:', error);
      toast({
        title: "Error",
        description: `Failed to save business: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleProductSubmit = async () => {
    if (!business) {
      toast({
        title: "Error",
        description: "Please create your business first.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productForm)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            ...productForm,
            business_id: business.id
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Product saved successfully.",
      });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ name: "", description: "", price: 0, image_url: "" });
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: `Failed to save product: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.title || '',
        description: product.description,
        price: product.price,
        image_url: product.image_url || ""
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", description: "", price: 0, image_url: "" });
    }
    setIsProductDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground">Manage your business and products</p>
        </div>
        {business ? (
          <Dialog open={isBusinessDialogOpen} onOpenChange={setIsBusinessDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Building className="w-4 h-4 mr-2" />
                Edit Business
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Business</DialogTitle>
                <DialogDescription>
                  Update your business information
                </DialogDescription>
              </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={businessForm.category_id} onValueChange={(value) => setBusinessForm({ ...businessForm, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={businessForm.website}
                    onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="island">Island</Label>
                  <Select value={businessForm.island} onValueChange={(value) => setBusinessForm({ ...businessForm, island: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select island" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mahé">Mahé</SelectItem>
                      <SelectItem value="Praslin">Praslin</SelectItem>
                      <SelectItem value="La Digue">La Digue</SelectItem>
                      <SelectItem value="Silhouette">Silhouette</SelectItem>
                      <SelectItem value="Curieuse">Curieuse</SelectItem>
                      <SelectItem value="Bird">Bird</SelectItem>
                      <SelectItem value="Denis">Denis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    placeholder="Enter your business address"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => geocodeAddress(businessForm.address)}
                    disabled={!businessForm.address.trim() || isLoading}
                    className="flex items-center gap-1"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    {isLoading ? "Getting Location..." : "Get Location"}
                  </Button>
                </div>
                
                {/* Manual Coordinate Input */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={businessForm.latitude || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, latitude: e.target.value ? Number(e.target.value) : null })}
                      placeholder="-4.6515344"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={businessForm.longitude || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, longitude: e.target.value ? Number(e.target.value) : null })}
                      placeholder="55.4863716"
                    />
                  </div>
                </div>
                
                {businessForm.latitude && businessForm.longitude && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Navigation className="w-4 h-4" />
                      <span>Location: {businessForm.latitude.toFixed(6)}, {businessForm.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBusinessDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBusinessSubmit}>
                {business ? "Update Business" : "Create Business"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        ) : (
          <Button onClick={() => navigate('/business/register')}>
            <Building className="w-4 h-4 mr-2" />
            Register Business
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products" onClick={() => navigate('/business/products')}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            My Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {business ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {business.title}
                </CardTitle>
                <CardDescription>{business.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{business.address}, {business.island}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{business.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{business.email}</span>
                  </div>
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {business.categories && (
                    <Badge variant="outline">{business.categories.title}</Badge>
                  )}
                  <Badge variant={business.is_active && business.is_verified ? 'default' : 'secondary'}>
                    {business.is_active && business.is_verified ? 'Active' : business.is_active ? 'Pending' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Business Registered</h3>
                <p className="text-muted-foreground mb-4">
                  Register your business to start listing products and services.
                </p>
                <Button onClick={() => navigate('/business/register')}>
                  Register Business
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardContent className="text-center py-8">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Manage Your Products</h3>
              <p className="text-muted-foreground mb-4">
                Select products from the global catalog and customize them for your business.
              </p>
              <Button asChild>
                <Link to="/business/products">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Go to My Products
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Add a new product or service"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="product-image">Image URL</Label>
              <Input
                id="product-image"
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProductSubmit}>
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessDashboard;
