import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const productSchema = z.object({
  title: z.string().min(2, "Product title must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().optional(),
  duration: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  stock: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface Product {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  duration?: string | null;
  is_active: boolean;
  searchable: boolean;
  image_url?: string | null;
  stock: number;
  business_id?: string | null;
  slug?: string | null;
  created_at: string;
  updated_at: string;
}

interface Business {
  id: string;
  name: string;
}

interface ProductManagerProps {
  business: Business;
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductManager = ({ business, product, onClose, onSave }: ProductManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [businessVerified, setBusinessVerified] = useState(true);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      price: product?.price?.toString() || "",
      duration: product?.duration || "",
      image_url: product?.image_url || "",
      stock: product?.stock?.toString() || "0",
    },
  });


  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedImageTypes.includes(file.type)) {
      errors.push('Only JPEG, PNG, and WebP formats are allowed');
    }
    if (file.size > maxImageSize) {
      errors.push('File size must be less than 5MB');
    }

    return errors;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${business.id}/${Date.now()}-${Math.random()}.${fileExt}`;
    
    setUploadProgress(0);
    
    try {
      const PRODUCT_IMAGES_BUCKET = import.meta.env.VITE_IMAGE_BUCKET_PRODUCTS || 'product-images';
      
      const { data: bucketData, error: bucketError } = await supabase.storage
        .getBucket(PRODUCT_IMAGES_BUCKET);
      
      if (bucketError) {
        console.error('Product images bucket not accessible:', {
          bucket: PRODUCT_IMAGES_BUCKET,
          error: bucketError
        });
        throw new Error(`Product images storage bucket '${PRODUCT_IMAGES_BUCKET}' is not available`);
      }
      
      const { data, error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(fileName, file);

      if (error) {
        console.error('Product image upload error:', error);
        throw error;
      }
      
      const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(fileName);
      
      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded product image');
      }
      
      setUploadProgress(100);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Product image upload failed:', error);
      throw error;
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user) return;

    setValidationErrors([]);
    setLoading(true);
    setUploadProgress(0);
    
    try {
      let imageUrl = data.image_url || null;

      // Upload image file if provided
      if (imageFile) {
        const imageErrors = validateFile(imageFile);
        if (imageErrors.length > 0) {
          setValidationErrors(imageErrors);
          toast({
            title: "File Validation Error",
            description: imageErrors[0],
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        title: data.title,
        description: data.description || null,
        price: data.price ? parseFloat(data.price) : null,
        duration: data.duration || null,
        image_url: imageUrl,
        stock: data.stock ? parseInt(data.stock) : 0,
        is_active: true,
        searchable: true,
        business_id: business.id,
      };

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;

        toast({
          title: "Product Updated",
          description: "Your product has been updated successfully.",
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Product Created",
          description: "Your product has been created successfully.",
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleImageFile = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    
    const errors = validateFile(file);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "File Validation Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }
    
    setValidationErrors([]);
    setImageFile(file);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {product ? "Update your product information" : "Add a new product or service to your business"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Progress Bar */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-medium text-destructive mb-2">File Validation Errors:</h4>
                <ul className="text-sm text-destructive space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product or service..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (SCR, Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2 hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Or Upload Image (Max 5MB, JPEG/PNG/WebP)</FormLabel>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleImageFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: JPEG, PNG, WebP. Max size: 5MB.
                </p>
                {imageFile && (
                  <div className="mt-2">
                    <img 
                      src={URL.createObjectURL(imageFile)} 
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleImageFile(null)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                )}
                {product?.image_url && !imageFile && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-600 mb-2">Current image:</p>
                    <img 
                      src={product.image_url} 
                      alt="Current"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductManager;
