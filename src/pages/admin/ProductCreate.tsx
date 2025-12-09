import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  createProductMaster,
  createBusinessProduct,
  fetchAllProducts,
  type Product
} from '@/lib/products-api';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Package, 
  DollarSign, 
  Tag, 
  Building,
  Plus,
  Loader2,
  Clock,
  Link as LinkIcon
} from 'lucide-react';

interface Business {
  id: string;
  title: string;
  address: string;
  island: string;
}

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [masterProducts, setMasterProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [createNewProduct, setCreateNewProduct] = useState(true);

  // Form state for master product (if creating new)
  const [masterProductData, setMasterProductData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    image_url: '' as string,  // Single URL string
    stock: '',
    slug: '',
  });

  // Form state for business-product link
  const [linkData, setLinkData] = useState({
    business_id: '',
    product_id: '',
    title_override: '',
    description_override: '',
    price_override: '',
    currency_code: 'SCR',
    duration_minutes: '',
    booking_url: '',
    notes: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'tours', 'equipment', 'food', 'accommodation', 'transport', 
    'activities', 'souvenirs', 'services', 'entertainment', 'health',
    'education', 'training', 'certification'
  ];

  useEffect(() => {
    fetchBusinesses();
    fetchMasterProducts();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, title, address, island')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive",
      });
    }
  };

  const fetchMasterProducts = async () => {
    try {
      const products = await fetchAllProducts();
      setMasterProducts(products);
    } catch (error) {
      console.error('Error fetching master products:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setLinkData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMasterProductChange = (field: string, value: string) => {
    setMasterProductData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductSelect = (productId: string) => {
    const product = masterProducts.find(p => p.id === productId);
    if (product) {
      setLinkData(prev => ({
        ...prev,
        product_id: productId,
        title_override: prev.title_override || product.title,
        description_override: prev.description_override || product.description || ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!linkData.business_id) {
      newErrors.business_id = 'Business is required';
    }

    if (createNewProduct) {
      if (!masterProductData.title.trim()) {
        newErrors.master_title = 'Product title is required';
      }
      // Price is optional for master product - can be set in business-product link
      if (masterProductData.price && (isNaN(Number(masterProductData.price)) || Number(masterProductData.price) < 0)) {
        newErrors.master_price = 'Price must be a valid number';
      }
    } else {
      if (!linkData.product_id) {
        newErrors.product_id = 'Product is required';
      }
    }

    // Price override is optional - if not provided, will use master product price
    // But if provided, it must be valid
    const priceValue = linkData.price_override;
    if (priceValue && (isNaN(Number(priceValue)) || Number(priceValue) < 0)) {
      newErrors.price_override = 'Price must be a valid number';
    }

    // Ensure at least one price is provided (either master product price or override)
    if (createNewProduct) {
      const hasMasterPrice = masterProductData.price && !isNaN(Number(masterProductData.price)) && Number(masterProductData.price) > 0;
      const hasOverridePrice = priceValue && !isNaN(Number(priceValue)) && Number(priceValue) > 0;
      if (!hasMasterPrice && !hasOverridePrice) {
        newErrors.price_override = 'Please provide a price (either in master product or business-specific price)';
      }
    } else {
      // When linking existing product, price override is optional (can use product's default price)
      // No validation needed here
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const PRODUCT_IMAGES_BUCKET = import.meta.env.VITE_IMAGE_BUCKET_PRODUCTS || 'product-images';
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      setImagePreview(urlData.publicUrl);
                        setMasterProductData(prev => ({ 
                          ...prev, 
                          image_url: urlData.publicUrl
                        }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let productId = linkData.product_id;

      // Step 1: Create master product if needed
      if (createNewProduct) {
        const newProduct = await createProductMaster({
          title: masterProductData.title,
          description: masterProductData.description || '',
          price: Number(masterProductData.price),
          duration: masterProductData.duration || '',
          image_url: masterProductData.image_url.length > 0 
            ? (Array.isArray(masterProductData.image_url) ? masterProductData.image_url[0] : masterProductData.image_url)
            : null,
          stock: masterProductData.stock ? Number(masterProductData.stock) : 0,
          slug: masterProductData.slug || '',
          is_active: true,
          searchable: true
        });

        if (!newProduct) {
          throw new Error('Failed to create master product');
        }

        productId = newProduct.id;
      }

      // Step 2: Create business-product link
      // Use price_override if provided, otherwise use master product price
      const businessPrice = linkData.price_override && !isNaN(Number(linkData.price_override)) && Number(linkData.price_override) > 0
        ? Number(linkData.price_override)
        : (createNewProduct && masterProductData.price && !isNaN(Number(masterProductData.price)) && Number(masterProductData.price) > 0
          ? Number(masterProductData.price)
          : null);

      const businessProduct = await createBusinessProduct({
        business_id: linkData.business_id,
        product_id: productId,
        title_override: linkData.title_override || null,
        description_override: linkData.description_override || null,
        price_override: businessPrice,
        is_active: linkData.is_active
      });

      if (!businessProduct) {
        throw new Error('Failed to create business-product link');
      }

      toast({
        title: "Success",
        description: createNewProduct 
          ? "Product created and linked to business successfully" 
          : "Product linked to business successfully",
      });

      // Navigate back to admin products tab
      navigate('/admin?tab=products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold">Link Product to Business</h1>
            <p className="text-muted-foreground">Create a master product or link existing product to a business</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={createNewProduct ? 'new' : 'existing'} onValueChange={(v) => setCreateNewProduct(v === 'new')}>
          <TabsList>
            <TabsTrigger value="new">
              <Plus className="w-4 h-4 mr-2" />
              Create New Product
            </TabsTrigger>
            <TabsTrigger value="existing">
              <LinkIcon className="w-4 h-4 mr-2" />
              Link Existing Product
            </TabsTrigger>
          </TabsList>

          {/* Create New Master Product Tab */}
          <TabsContent value="new" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Master Product Information
                </CardTitle>
                <CardDescription>
                  Create a new product in the master catalogue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="master_title">Product Title *</Label>
                    <Input
                      id="master_title"
                      value={masterProductData.title}
                      onChange={(e) => handleMasterProductChange('title', e.target.value)}
                      className={errors.master_title ? 'border-red-500' : ''}
                      placeholder="Enter product title"
                    />
                    {errors.master_title && <p className="text-sm text-red-500">{errors.master_title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="master_slug">Slug</Label>
                    <Input
                      id="master_slug"
                      value={masterProductData.slug}
                      onChange={(e) => handleMasterProductChange('slug', e.target.value)}
                      placeholder="URL-friendly slug (auto-generated if empty)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="master_description">Description</Label>
                  <Textarea
                    id="master_description"
                    value={masterProductData.description}
                    onChange={(e) => handleMasterProductChange('description', e.target.value)}
                    rows={4}
                    placeholder="Describe the product..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="master_price">
                      Default Price (Optional - can be set in business-specific price below)
                    </Label>
                    <Input
                      id="master_price"
                      type="number"
                      step="0.01"
                      value={masterProductData.price}
                      onChange={(e) => handleMasterProductChange('price', e.target.value)}
                      className={errors.master_price ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {errors.master_price && <p className="text-sm text-red-500">{errors.master_price}</p>}
                    <p className="text-xs text-muted-foreground">
                      You can set a default price here or specify it in the business-specific configuration below
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="master_duration">Duration</Label>
                    <Input
                      id="master_duration"
                      value={masterProductData.duration}
                      onChange={(e) => handleMasterProductChange('duration', e.target.value)}
                      placeholder="e.g., 1 night, 2 hours"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="master_stock">Stock</Label>
                    <Input
                      id="master_stock"
                      type="number"
                      value={masterProductData.stock}
                      onChange={(e) => handleMasterProductChange('stock', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  {imagePreview && (
                    <div className="relative mb-2">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview('');
                          setMasterProductData(prev => ({ ...prev, image_url: '' }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImagePreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {imageFile && (
                    <Button
                      type="button"
                      onClick={() => handleImageUpload(imageFile)}
                      disabled={uploading}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Link Existing Product Tab */}
          <TabsContent value="existing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Select Existing Product
                </CardTitle>
                <CardDescription>
                  Choose a product from the master catalogue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product *</Label>
                  <Select 
                    value={linkData.product_id} 
                    onValueChange={handleProductSelect}
                  >
                    <SelectTrigger className={errors.product_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.product_id && <p className="text-sm text-red-500">{errors.product_id}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Business-Product Link Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business-Specific Configuration
            </CardTitle>
            <CardDescription>
              Set pricing, duration, and other details for this business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_id">Business *</Label>
              <Select 
                value={linkData.business_id} 
                onValueChange={(value) => handleInputChange('business_id', value)}
              >
                <SelectTrigger className={errors.business_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map(business => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.title} - {business.island}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_id && <p className="text-sm text-red-500">{errors.business_id}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title_override">Custom Title (Optional)</Label>
                <Input
                  id="title_override"
                  value={linkData.title_override}
                  onChange={(e) => handleInputChange('title_override', e.target.value)}
                  placeholder="Override product title for this business"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_code">Currency</Label>
                <Select 
                  value={linkData.currency_code} 
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
              <Label htmlFor="description_override">Custom Description (Optional)</Label>
              <Textarea
                id="description_override"
                value={linkData.description_override}
                onChange={(e) => handleInputChange('description_override', e.target.value)}
                rows={3}
                placeholder="Override product description for this business"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_override">
                  Business-Specific Price (SCR) 
                  {createNewProduct && masterProductData.price && !isNaN(Number(masterProductData.price)) && Number(masterProductData.price) > 0 
                    ? ' (Optional - will use master product price if not set)' 
                    : ' *'}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="price_override"
                    type="number"
                    step="0.01"
                    value={linkData.price_override}
                    onChange={(e) => handleInputChange('price_override', e.target.value)}
                    className={`pl-10 ${errors.price_override ? 'border-red-500' : ''}`}
                    placeholder={createNewProduct && masterProductData.price 
                      ? `Default: ${masterProductData.price}` 
                      : "0.00"}
                  />
                </div>
                {errors.price_override && <p className="text-sm text-red-500">{errors.price_override}</p>}
                {!createNewProduct && linkData.product_id && (
                  <p className="text-xs text-muted-foreground">
                    Default product price: {masterProducts.find(p => p.id === linkData.product_id)?.price 
                      ? `₨${masterProducts.find(p => p.id === linkData.product_id)?.price}` 
                      : 'Not set'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={linkData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                    className="pl-10"
                    placeholder="e.g., 120 for 2 hours"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking_url">Booking URL (Optional)</Label>
                <Input
                  id="booking_url"
                  type="url"
                  value={linkData.booking_url}
                  onChange={(e) => handleInputChange('booking_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Conditions (Optional)</Label>
                <Textarea
                  id="notes"
                  value={linkData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  placeholder="Special conditions, offers, etc."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={linkData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active (visible to public)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {createNewProduct ? 'Create Product & Link' : 'Link Product'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductCreate;
