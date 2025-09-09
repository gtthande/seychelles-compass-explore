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
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  status: z.string().default("draft"),
  in_stock: z.boolean().default(true),
  stock_quantity: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  tags: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  category: string | null;
  status: string | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  images: string[] | null;
  catalogue_url: string | null;
  sku: string | null;
  unit: string | null;
  tags: string[] | null;
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [catalogueFile, setCatalogueFile] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [businessVerified, setBusinessVerified] = useState(true);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price?.toString() || "",
      currency: product?.currency || "SCR",
      category: product?.category || "",
      status: product?.status || "draft",
      in_stock: product?.in_stock ?? true,
      stock_quantity: product?.stock_quantity?.toString() || "",
      sku: product?.sku || "",
      unit: product?.unit || "",
      tags: product?.tags?.join(", ") || "",
    },
  });

  const currencies = [
    { value: "SCR", label: "SCR - Seychellois Rupee" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
  ];

  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);

  // Fetch categories from database
  useEffect(() => {
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
        // Fallback to default categories if fetch fails
        setCategories([
          { value: "food", label: "Food & Beverages" },
          { value: "accommodation", label: "Accommodation" },
          { value: "tours", label: "Tours & Activities" },
          { value: "transport", label: "Transportation" },
          { value: "retail", label: "Retail Products" },
          { value: "services", label: "Services" },
          { value: "entertainment", label: "Entertainment" },
        ]);
      }
    };

    fetchCategories();
  }, []);

  const validateFiles = (files: File[], type: 'image' | 'pdf'): string[] => {
    const errors: string[] = [];
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxPdfSize = 10 * 1024 * 1024; // 10MB
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedPdfTypes = ['application/pdf'];

    files.forEach((file, index) => {
      if (type === 'image') {
        if (!allowedImageTypes.includes(file.type)) {
          errors.push(`Image ${index + 1}: Only JPEG, PNG, and WebP formats are allowed`);
        }
        if (file.size > maxImageSize) {
          errors.push(`Image ${index + 1}: File size must be less than 5MB`);
        }
      } else if (type === 'pdf') {
        if (!allowedPdfTypes.includes(file.type)) {
          errors.push(`Catalogue: Only PDF format is allowed`);
        }
        if (file.size > maxPdfSize) {
          errors.push(`Catalogue: File size must be less than 10MB`);
        }
      }
    });

    return errors;
  };

  const uploadFiles = async () => {
    const imageUrls: string[] = [...existingImages];
    let catalogueUrl = product?.catalogue_url;
    let totalFiles = imageFiles.length + (catalogueFile ? 1 : 0);
    let uploadedFiles = 0;

    setUploadProgress(0);

    // Upload images
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${business.id}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      try {
        // Verify bucket exists and is accessible
        const { data: bucketData, error: bucketError } = await supabase.storage
          .getBucket('product-images');
        
        if (bucketError) {
          console.error('Product images bucket not accessible:', bucketError);
          throw new Error('Product images storage is not available');
        }
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) {
          console.error('Product image upload error:', error);
          throw error;
        }
        
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded product image');
        }
        
        imageUrls.push(publicUrlData.publicUrl);
        
        uploadedFiles++;
        setUploadProgress((uploadedFiles / totalFiles) * 50); // 50% for image uploads
      } catch (error) {
        console.error('Product image upload failed:', error);
        throw error;
      }
    }

    // Upload catalogue
    if (catalogueFile) {
      const fileExt = catalogueFile.name.split('.').pop();
      const fileName = `${business.id}/catalogue-${Date.now()}.${fileExt}`;
      
      try {
        // Verify bucket exists and is accessible
        const { data: bucketData, error: bucketError } = await supabase.storage
          .getBucket('product-catalogues');
        
        if (bucketError) {
          console.error('Product catalogues bucket not accessible:', bucketError);
          throw new Error('Product catalogues storage is not available');
        }
        
        const { data, error } = await supabase.storage
          .from('product-catalogues')
          .upload(fileName, catalogueFile);

        if (error) {
          console.error('Catalogue upload error:', error);
          throw error;
        }
        
        const { data: publicUrlData } = supabase.storage.from('product-catalogues').getPublicUrl(fileName);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded catalogue');
        }
        
        catalogueUrl = publicUrlData.publicUrl;
        uploadedFiles++;
        setUploadProgress((uploadedFiles / totalFiles) * 50);
      } catch (error) {
        console.error('Catalogue upload failed:', error);
        throw error;
      }
    }

    setUploadProgress(100);
    return { imageUrls, catalogueUrl };
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user) return;

    // Validate files before submission
    const imageErrors = validateFiles(imageFiles, 'image');
    const pdfErrors = catalogueFile ? validateFiles([catalogueFile], 'pdf') : [];
    const allErrors = [...imageErrors, ...pdfErrors];

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      toast({
        title: "File Validation Error",
        description: "Please fix the file errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors([]);
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const { imageUrls, catalogueUrl } = await uploadFiles();

      const productData = {
        name: data.name,
        description: data.description || null,
        price: data.price ? parseFloat(data.price) : null,
        currency: data.currency || null,
        category: data.category || null,
        status: data.status as any,
        in_stock: data.in_stock,
        stock_quantity: data.stock_quantity ? parseInt(data.stock_quantity) : null,
        images: imageUrls.length > 0 ? imageUrls : null,
        catalogue_url: catalogueUrl,
        business_id: business.id,
        sku: data.sku || null,
        unit: data.unit || null,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : null,
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

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const errors = validateFiles(fileArray, 'image');
    
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
    setImageFiles([...imageFiles, ...fileArray]);
  };

  const handleCatalogueFile = (file: File | null) => {
    if (!file) return;
    const errors = validateFiles([file], 'pdf');
    
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
    setCatalogueFile(file);
  };

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages(existingImages.filter((_, index) => index !== indexToRemove));
  };

  const removeNewImage = (indexToRemove: number) => {
    setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
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
                    <FormLabel>Price (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Product SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., piece, kg, liter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tags separated by commas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="in_stock"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>In Stock</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Stock Quantity (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Current Images</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <div className="space-y-2">
              <FormLabel>Add Images (Max 5MB each, JPEG/PNG/WebP)</FormLabel>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={(e) => handleImageFiles(e.target.files)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: JPEG, PNG, WebP. Max size: 5MB per image.
                </p>
              </div>
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catalogue Upload */}
            <div className="space-y-2">
              <FormLabel>Product Catalogue (PDF Only, Max 10MB)</FormLabel>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleCatalogueFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  PDF format only. Max size: 10MB.
                </p>
                {catalogueFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {catalogueFile.name}
                  </p>
                )}
                {product?.catalogue_url && !catalogueFile && (
                  <p className="text-sm text-blue-600 mt-2">
                    Current catalogue uploaded
                  </p>
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
