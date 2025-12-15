import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Loader2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state for product creation
  // NOTE: products table uses 'name' (NOT 'title')
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    duration: '',
    image_url: '',
    is_active: true,
  });

  const [categories, setCategories] = useState<{id: string, title: string}[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, title')
          .eq('is_active', true)
          .order('title');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setProductData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid Image Type",
        description: "Please select a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `Image must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploading(true);
    const PRODUCT_IMAGES_BUCKET = import.meta.env.VITE_IMAGE_BUCKET_PRODUCTS || 'product-images';

    try {
      // Verify bucket exists and is accessible
      const { data: bucketData, error: bucketError } = await supabase.storage
        .getBucket(PRODUCT_IMAGES_BUCKET);

      if (bucketError) {
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

      const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      // Update form data with image URL
      setProductData(prev => ({ ...prev, image_url: urlData.publicUrl }));

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Error",
        description: error?.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setProductData(prev => ({ ...prev, image_url: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!productData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (productData.price && (isNaN(Number(productData.price)) || Number(productData.price) < 0)) {
      newErrors.price = 'Price must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    // Upload image first if selected but not yet uploaded
    let imageUrl = productData.image_url;
    if (imageFile && !productData.image_url) {
      const uploadedUrl = await handleImageUpload();
      if (!uploadedUrl) {
        // Upload failed, don't proceed with product creation
        return;
      }
      imageUrl = uploadedUrl;
    }

    setLoading(true);
    try {
      // Insert ONLY into products table
      // Schema: products table uses 'name' (NOT 'title')
      const insertData: {
        name: string;
        description?: string | null;
        category_id?: string | null;
        price?: number | null;
        duration?: string | null;
        image_url?: string | null;
        is_active: boolean;
        searchable: boolean;
      } = {
        name: productData.name.trim(),
        description: productData.description.trim() || null,
        is_active: productData.is_active,
        searchable: true,
      };

      // Only include category_id if provided
      if (productData.category_id && productData.category_id.trim()) {
        insertData.category_id = productData.category_id;
      }

      // Only include price if provided
      if (productData.price && productData.price.trim()) {
        insertData.price = Number(productData.price);
      }

      // Only include duration if provided
      if (productData.duration && productData.duration.trim()) {
        insertData.duration = productData.duration.trim();
      }

      // Only include image_url if provided
      if (imageUrl && imageUrl.trim()) {
        insertData.image_url = imageUrl.trim();
      }

      const { data, error } = await supabase
        .from('products')
        .insert([insertData])
        .select(`
          id,
          name,
          description,
          category_id,
          image_url,
          price,
          duration,
          slug,
          is_active,
          searchable,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Product created successfully",
      });

      navigate('/admin');
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
            <h1 className="text-2xl font-bold">Create Product</h1>
            <p className="text-muted-foreground">Add a new product to the master catalogue</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Information
            </CardTitle>
            <CardDescription>
              Create a new product in the master catalogue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={productData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                placeholder="Describe the product..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                value={productData.category_id}
                onValueChange={(value) => handleInputChange('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={productData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Optional)</Label>
                <Input
                  id="duration"
                  value={productData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g., 2 hours"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </span>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG, WebP or GIF (max. 5MB)
                    </p>
                  </div>
                )}
                {imageFile && !productData.image_url && (
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={uploading}
                    variant="outline"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={productData.is_active}
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
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductCreate;
