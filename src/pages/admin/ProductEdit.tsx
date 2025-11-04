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
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Package, 
  DollarSign, 
  Tag, 
  Building,
  Trash2,
  Loader2
} from 'lucide-react';

interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  status: string;
  searchable: boolean;
  created_at: string;
  updated_at: string;
}

interface Business {
  id: string;
  name: string;
  address: string;
  island: string;
}

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    business_id: '',
    name: '',
    description: '',
    price: '',
    category: '',
    status: 'active',
    searchable: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'tours', 'equipment', 'food', 'accommodation', 'transport', 
    'activities', 'souvenirs', 'services', 'entertainment', 'health',
    'education', 'training', 'certification'
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'draft', label: 'Draft' }
  ];

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchBusinesses();
    }
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setProduct(data);
      setFormData({
        business_id: data.business_id || '',
        name: data.name || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        category: data.category || '',
        status: data.status || 'active',
        searchable: data.searchable ?? true
      });

      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, address, island')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.business_id) {
      newErrors.business_id = 'Business is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const startTime = performance.now();
    const PRODUCT_IMAGES_BUCKET = import.meta.env.VITE_IMAGE_BUCKET_PRODUCTS || 'product-images';
    
    console.log('📤 Starting product image upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      bucket: PRODUCT_IMAGES_BUCKET
    });

    try {
      // Verify bucket exists and is accessible
      console.log(`🔍 Verifying bucket '${PRODUCT_IMAGES_BUCKET}' exists...`);
      const { data: bucketData, error: bucketError } = await supabase.storage
        .getBucket(PRODUCT_IMAGES_BUCKET);
      
      if (bucketError) {
        const errorDetails = {
          bucket: PRODUCT_IMAGES_BUCKET,
          error: bucketError,
          message: bucketError.message,
          code: bucketError.statusCode || 'N/A',
          timestamp: new Date().toISOString()
        };
        
        console.error('❌ Bucket verification failed:', errorDetails);
        
        let errorDescription = `The '${PRODUCT_IMAGES_BUCKET}' storage bucket is not available. `;
        
        if (bucketError.message?.includes('not found') || bucketError.statusCode === 404) {
          errorDescription += `Please create the bucket in Supabase Dashboard:\n1. Go to Storage in Supabase Dashboard\n2. Click "New bucket"\n3. Name it "${PRODUCT_IMAGES_BUCKET}"\n4. Set it to Public\n5. Save`;
        } else if (bucketError.message?.includes('permission') || bucketError.statusCode === 403) {
          errorDescription += `You don't have permission to access this bucket. Please contact an administrator.`;
        } else {
          errorDescription += `Error: ${bucketError.message}. Check the console for details.`;
        }
        
        toast({
          title: "Storage Error",
          description: errorDescription,
          variant: "destructive",
          duration: 10000,
        });
        throw new Error(`Bucket '${PRODUCT_IMAGES_BUCKET}' is not accessible: ${bucketError.message}`);
      }

      console.log('✅ Bucket verified:', {
        bucket: PRODUCT_IMAGES_BUCKET,
        public: bucketData?.public || false,
        createdAt: bucketData?.created_at || 'N/A'
      });

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log(`⬆️  Uploading file to bucket:`, {
        bucket: PRODUCT_IMAGES_BUCKET,
        filePath,
        fileSize: file.size
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload failed:', {
          error: uploadError,
          message: uploadError.message,
          code: uploadError.statusCode || 'N/A',
          bucket: PRODUCT_IMAGES_BUCKET,
          filePath
        });
        throw uploadError;
      }

      console.log('✅ Upload successful:', {
        path: uploadData?.path || filePath,
        bucket: PRODUCT_IMAGES_BUCKET
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        console.error('❌ Failed to generate public URL:', {
          filePath,
          bucket: PRODUCT_IMAGES_BUCKET
        });
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('✅ Public URL generated:', {
        url: urlData.publicUrl,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      setImagePreview(urlData.publicUrl);
      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      const errorDetails = {
        error,
        message: error?.message || 'Unknown error',
        code: error?.statusCode || error?.code || 'N/A',
        bucket: PRODUCT_IMAGES_BUCKET,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      };
      
      console.error('❌ Image upload error (full details):', errorDetails);
      
      const errorMessage = error?.message || "Failed to upload image";
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('bucket') || errorMessage.includes('not found') || error?.statusCode === 404) {
        toast({
          title: "Bucket Not Found",
          description: `The '${PRODUCT_IMAGES_BUCKET}' storage bucket does not exist. Please create it in the Supabase Dashboard under Storage (set to public), or run the migration to create it.`,
          variant: "destructive",
        });
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || error?.statusCode === 403) {
        toast({
          title: "Permission Denied",
          description: `You don't have permission to upload to the '${PRODUCT_IMAGES_BUCKET}' bucket. Please contact an administrator.`,
          variant: "destructive",
        });
      } else if (errorMessage.includes('duplicate') || error?.statusCode === 409) {
        toast({
          title: "File Already Exists",
          description: "A file with this name already exists. Please try again or choose a different image.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: `Failed to upload image: ${errorMessage}. Check the console for details.`,
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
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

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        price: Number(formData.price),
        image_url: imagePreview || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      navigate('/admin');
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      navigate('/admin');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Product...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The product you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">Update product information and settings</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_id">Business *</Label>
                  <Select 
                    value={formData.business_id} 
                    onValueChange={(value) => handleInputChange('business_id', value)}
                  >
                    <SelectTrigger className={errors.business_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select business" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map(business => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name} - {business.island}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.business_id && <p className="text-sm text-red-500">{errors.business_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  placeholder="Describe the product..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (SCR) *</Label>
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
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview('');
                      setFormData(prev => ({ ...prev, image_url: '' }));
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
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

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Product Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="searchable"
                  checked={formData.searchable}
                  onCheckedChange={(checked) => handleInputChange('searchable', checked)}
                />
                <Label htmlFor="searchable">Make product searchable</Label>
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
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;

