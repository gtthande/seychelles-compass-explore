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
  fetchBusinessProducts,
  type BusinessProduct
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
  
  const [businessProduct, setBusinessProduct] = useState<BusinessProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

    // Form state for business-product link
  const [formData, setFormData] = useState({
    title_override: '',
    description_override: '',
    price_override: '',
    price_from: '',  // Legacy support
    price_to: '',  // Legacy support
    currency_code: 'SCR',
    duration_minutes: '',
    booking_url: '',
    notes: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchBusinessProduct();
    }
  }, [id]);

  const fetchBusinessProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await fetchBusinessProducts({ limit: 1 });
      const bp = result.businessProducts.find(p => p.id === id);
      
      if (!bp) {
        throw new Error('Business product not found');
      }

      setBusinessProduct(bp);
      setFormData({
        title_override: bp.title_override || '',
        description_override: bp.description_override || '',
        price_override: bp.price_override?.toString() || bp.price_from?.toString() || '',
        price_from: bp.price_from?.toString() || '',  // Legacy support
        price_to: bp.price_to?.toString() || '',  // Legacy support
        currency_code: bp.currency_code || 'SCR',
        duration_minutes: bp.duration_minutes?.toString() || '',
        booking_url: bp.booking_url || '',
        notes: bp.notes || '',
        is_active: bp.is_active ?? true
      });
    } catch (error: any) {
      console.error('Error fetching business product:', error);
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

    const priceValue = formData.price_override || formData.price_from;
    if (!priceValue || isNaN(Number(priceValue)) || Number(priceValue) <= 0) {
      newErrors.price_override = 'Valid price is required';
    }

    if (formData.price_to && (isNaN(Number(formData.price_to)) || Number(formData.price_to) < Number(priceValue))) {
      newErrors.price_to = 'Maximum price must be greater than minimum price';
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
        title_override: formData.title_override || null,
        description_override: formData.description_override || null,
        price_override: Number(formData.price_override || formData.price_from),
        price_from: Number(formData.price_from),  // Legacy support
        price_to: formData.price_to ? Number(formData.price_to) : null,  // Legacy support
        currency_code: formData.currency_code,
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
        booking_url: formData.booking_url || null,
        notes: formData.notes || null,
        is_active: formData.is_active
      });

      if (!updated) {
        throw new Error('Failed to update business product');
      }

      setBusinessProduct(updated);
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

  if (!businessProduct) {
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

  const displayTitle = businessProduct.title_override || businessProduct.product?.title || 'Unknown Product';
  const displayDescription = businessProduct.description_override || businessProduct.product?.description || '';
  const productTitle = businessProduct.product?.title || 'Unknown Product';

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
              {businessProduct.product?.title && (
                <div>
                  <Label>Product Title</Label>
                  <p className="text-sm font-medium">{businessProduct.product.title}</p>
                </div>
              )}
              {businessProduct.product?.description && (
                <div>
                  <Label>Product Description</Label>
                  <p className="text-sm text-muted-foreground">{businessProduct.product.description}</p>
                </div>
              )}
              {businessProduct.product?.image_url && (
                <div>
                  <Label>Product Image</Label>
                  <img
                    src={businessProduct.product.image_url}
                    alt={productTitle}
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
                <p className="text-sm font-medium">{businessProduct.business?.name}</p>
                {businessProduct.business?.island && (
                  <p className="text-sm text-muted-foreground">{businessProduct.business.island}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title_override">Custom Title (Optional)</Label>
                <Input
                  id="title_override"
                  value={formData.title_override}
                  onChange={(e) => handleInputChange('title_override', e.target.value)}
                  placeholder="Override product title for this business"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use master product title: {businessProduct.product?.title || 'Unknown Product'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_override">Custom Description (Optional)</Label>
                <Textarea
                  id="description_override"
                  value={formData.description_override}
                  onChange={(e) => handleInputChange('description_override', e.target.value)}
                  rows={4}
                  placeholder="Override product description for this business"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use master product description
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_override">Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price_override"
                      type="number"
                      step="0.01"
                      value={formData.price_override || formData.price_from}
                      onChange={(e) => handleInputChange('price_override', e.target.value)}
                      className={`pl-10 ${errors.price_override ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price_override && <p className="text-sm text-red-500">{errors.price_override}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_to">Price To (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price_to"
                      type="number"
                      step="0.01"
                      value={formData.price_to}
                      onChange={(e) => handleInputChange('price_to', e.target.value)}
                      className={`pl-10 ${errors.price_to ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price_to && <p className="text-sm text-red-500">{errors.price_to}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency_code">Currency</Label>
                  <Select 
                    value={formData.currency_code} 
                    onValueChange={(value) => handleInputChange('currency_code', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCR">SCR (Seychelles Rupee)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                    className="pl-10"
                    placeholder="e.g., 120 for 2 hours"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booking_url">Booking URL (Optional)</Label>
                  <Input
                    id="booking_url"
                    type="url"
                    value={formData.booking_url}
                    onChange={(e) => handleInputChange('booking_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Conditions (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                    placeholder="Special conditions, offers, etc."
                  />
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
