import React, { useState, useEffect } from "react";
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
import { Building, Package, Plus, Edit, Trash2, MapPin, Phone, Mail, Globe, Navigation } from "lucide-react";
import BusinessLocationMap from "@/components/business/BusinessLocationMap";
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
  name: string;
  description: string;
  category: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  island: string;
  latitude: number | null;
  longitude: number | null;
  owner_id: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  business_id: string;
  image_url: string | null;
}

const BusinessDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);

  const [businessForm, setBusinessForm] = useState({
    name: "",
    description: "",
    category: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    island: "",
    latitude: null as number | null,
    longitude: null as number | null
  });

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    image_url: ""
  });

  useEffect(() => {
    if (user) {
      fetchBusiness();
      fetchProducts();
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('slug, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const categoryOptions = data?.map(cat => ({
        value: cat.slug,
        label: cat.name
      })) || [];
      
      setCategories(categoryOptions);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: address }
      });

      if (error) throw error;
      
      if (data && data.latitude && data.longitude) {
        setBusinessForm(prev => ({
          ...prev,
          latitude: data.latitude,
          longitude: data.longitude
        }));
        toast({
          title: 'Location Found',
          description: 'Coordinates have been automatically set for your address.',
        });
      } else {
        toast({
          title: 'Location Not Found',
          description: 'Could not find coordinates for this address. You can set them manually.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error geocoding address:', error);
      toast({
        title: 'Geocoding Failed',
        description: 'Could not get coordinates for this address.',
        variant: 'destructive',
      });
    }
  };

  const fetchBusiness = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBusiness(data);
        setBusinessForm({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          address: data.address || "",
          island: data.island || ""
        });
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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', business?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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
      setProductForm({ name: "", description: "", price: 0, category: "", image_url: "" });
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
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image_url: product.image_url || ""
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", description: "", price: 0, category: "", image_url: "" });
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
        <Dialog open={isBusinessDialogOpen} onOpenChange={setIsBusinessDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Building className="w-4 h-4 mr-2" />
              {business ? "Edit Business" : "Register Business"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{business ? "Edit Business" : "Register Your Business"}</DialogTitle>
              <DialogDescription>
                {business ? "Update your business information" : "Create your business profile to start listing products and services"}
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
                  <Select value={businessForm.category} onValueChange={(value) => setBusinessForm({ ...businessForm, category: value })}>
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
                    disabled={!businessForm.address.trim()}
                    className="flex items-center gap-1"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Location
                  </Button>
                </div>
                {businessForm.latitude && businessForm.longitude && (
                  <div className="mt-2 space-y-2">
                    <div className="p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Navigation className="w-4 h-4" />
                        <span>Location: {businessForm.latitude.toFixed(6)}, {businessForm.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                    <div className="h-32">
                      <BusinessLocationMap
                        business={{
                          id: 'preview',
                          name: businessForm.name || 'Business Location',
                          address: businessForm.address,
                          latitude: businessForm.latitude,
                          longitude: businessForm.longitude,
                          island: businessForm.island
                        }}
                        height="128px"
                        showTitle={false}
                      />
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
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {business ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {business.name}
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
                  <Badge variant="outline">{business.category}</Badge>
                  <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                    {business.status}
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
                <Button onClick={() => setIsBusinessDialogOpen(true)}>
                  Register Business
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Products & Services</h2>
            <Button onClick={() => openProductDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first product or service to get started.
                </p>
                <Button onClick={() => openProductDialog()}>
                  Add Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">${product.price}</span>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProductDialog(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
              <div>
                <Label htmlFor="product-category">Category</Label>
                <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
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
