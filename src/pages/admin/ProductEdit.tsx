import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  updateBusinessProduct,
  deleteBusinessProduct,
  type BusinessProduct,
  type Product
} from '@/lib/products-api';
import { 
  Save, 
  ArrowLeft, 
  Trash2,
  Package, 
  DollarSign, 
  Building,
  Loader2,
  Clock
} from 'lucide-react';

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [businessProductLink, setBusinessProductLink] = useState<{ id: string; business_id: string; price: number | null; duration: string | null; is_active: boolean } | null>(null);
  const [businessTitle, setBusinessTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for business-product link
  const [formData, setFormData] = useState({
    price: '',
    duration: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchProductData();
    }
  }, [id]);

  const fetchProductData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // First, fetch the business_product link to get product_id and business_id
      const { data: bpLink, error: bpError } = await supabase
        .from('business_products')
        .select('id, business_id, product_id, price, duration, is_active')
        .eq('id', id)
        .single();

      if (bpError || !bpLink) {
        throw new Error('Business product link not found');
      }

      // Fetch product data ONLY from products table with specified columns
      // Note: products table uses 'name' column (NOT 'title')
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, description, price, duration, image_url, category_id, is_active, searchable')
        .eq('id', bpLink.product_id)
        .single();

      if (productError || !productData) {
        throw new Error('Product not found');
      }

      // Fetch business title for display (separate query)
      const { data: businessData } = await supabase
        .from('businesses')
        .select('title')
        .eq('id', bpLink.business_id)
        .single();

      setProduct(productData as Product);
      setBusinessProductLink({
        id: bpLink.id,
        business_id: bpLink.business_id,
        price: bpLink.price,
        duration: bpLink.duration,
        is_active: bpLink.is_active
      });
      setBusinessTitle(businessData?.title || '');
      setFormData({
        price: bpLink.price?.toString() || '',
        duration: bpLink.duration || '',
        is_active: bpLink.is_active ?? true
      });
    } catch (error: any) {
      console.error('Error fetching product data:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load product data",
        variant: "destructive",
      });
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    if (!id) return;

    setSaving(true);
    try {
      const updated = await updateBusinessProduct(id, {
        price: Number(formData.price),
        duration: formData.duration || null,
        is_active: formData.is_active
      });

      if (!updated) {
        throw new Error('Failed to update business product');
      }

      // Update the business product link state
      setBusinessProductLink({
        id: updated.id,
        business_id: updated.business_id,
        price: updated.price,
        duration: updated.duration,
        is_active: updated.is_active
      });
      setFormData({
        price: updated.price?.toString() || '',
        duration: updated.duration || '',
        is_active: updated.is_active ?? true
      });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to remove this product from the business? This will not delete the master product.')) {
      return;
    }

    setSaving(true);
    try {
      const success = await deleteBusinessProduct(id);
      if (success) {
        toast({
          title: "Success",
          description: "Product removed from business successfully",
        });
        navigate('/admin');
      } else {
        throw new Error('Failed to delete business product');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to remove product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !businessProductLink) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Product not found</p>
            <Button onClick={() => navigate('/admin')} className="mt-4">
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const productName = product.name || 'Unknown Product';
  const displayTitle = productName;
  const displayDescription = product.description || '';

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Product: {displayTitle}</h1>
            <p className="text-muted-foreground">Update business-specific product configuration</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={saving}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove from Business
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Master Product Information
              </CardTitle>
              <CardDescription>
                This information comes from the master product catalogue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <p className="text-sm font-medium">{productName}</p>
              </div>
              {product.description && (
                <div>
                  <Label>Product Description</Label>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
              )}
              {product.category_id && (
                <div>
                  <Label>Category ID</Label>
                  <p className="text-sm">{product.category_id}</p>
                </div>
              )}
              {product.image_url && (
                <div>
                  <Label>Product Image</Label>
                  <img
                    src={product.image_url}
                    alt={productName}
                    className="w-full h-48 object-cover rounded-lg border mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business-Specific Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business-Specific Configuration
              </CardTitle>
              <CardDescription>
                Customize pricing, duration, and other details for this business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Business</Label>
                <p className="text-sm font-medium">{businessTitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="text"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="pl-10"
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active (visible to public)</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="w-full"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">About This Product</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>
                This is a business-specific instance of a master product. 
                Changes here only affect how this product appears for this business.
              </p>
              <p>
                The master product information (name, description, category, image) 
                is shared across all businesses and cannot be edited here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;
