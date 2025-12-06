import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  createProductMaster,
  createBusinessProduct
} from '@/lib/products-api';
import { 
  Upload, 
  X, 
  Package, 
  DollarSign, 
  Tag, 
  Building,
  Loader2
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  address: string;
  island: string;
}

interface AddProductModalProps {
  onProductAdded: () => void;
  trigger?: React.ReactNode;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ onProductAdded, trigger }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'tours',
    images: [] as string[],
    price: '',
    currency: 'SCR',
    stock: 0,
    is_active: true,
    status: 'draft',
    business_id: null as string | null,
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
    if (open) {
      fetchBusinesses();
    }
  }, [open]);

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
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    // Price is only required if linking to a business
    if (formData.business_id) {
      if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        newErrors.price = 'Valid price is required when linking to a business';
      }
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
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, urlData.publicUrl]
      }));
      
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
      // Step 1: Create master product (catalogue item) - no business_id
      const imageUrl = formData.images.length > 0 ? formData.images[0] : imagePreview || null;
      const newProduct = await createProductMaster({
        name: formData.name,
        title: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        image_url: imageUrl,
        status: formData.status === 'draft' ? 'active' : formData.status,
        searchable: true
      });

      if (!newProduct) {
        throw new Error('Failed to create master product');
      }

      // Step 2: If business_id is provided, create business-product link
      if (formData.business_id) {
        const businessProduct = await createBusinessProduct({
          business_id: formData.business_id,
          product_id: newProduct.id,
          title_override: null,
          description_override: null,
          price_from: Number(formData.price),
          price_to: null,
          currency_code: formData.currency || 'SCR',
          duration_minutes: null,
          booking_url: null,
          notes: null,
          is_active: formData.is_active
        });

        if (!businessProduct) {
          throw new Error('Failed to link product to business');
        }
      }

      toast({
        title: "Success",
        description: formData.business_id 
          ? "Product created and linked to business successfully" 
          : "Product created successfully",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'tours',
        images: [],
        price: '',
        currency: 'SCR',
        stock: 0,
        is_active: true,
        status: 'draft',
        business_id: null,
      });
      setImageFile(null);
      setImagePreview('');
      setOpen(false);
      onProductAdded();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Package className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add New Product
          </DialogTitle>
          <DialogDescription>
            Create a new product for the catalog
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_id">Business (Optional)</Label>
              <Select 
                value={formData.business_id || ''} 
                onValueChange={(value) => handleInputChange('business_id', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {businesses.map(business => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name} - {business.island}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              rows={3}
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
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCR">SCR - Seychellois Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="0"
              />
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

          {/* Image Upload */}
          <div className="space-y-4">
            <Label>Product Image</Label>
            {imagePreview && (
              <div className="relative">
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
                    setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter(img => img !== imagePreview)
                    }));
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
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
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Product is active</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
                'Create Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;

