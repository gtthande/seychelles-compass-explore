import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Upload,
  Image as ImageIcon,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Storage bucket constant - ensure consistency across the app
// Can be overridden via environment variable for flexibility
const CATEGORY_IMAGES_BUCKET = import.meta.env.VITE_IMAGE_BUCKET_CATEGORIES || import.meta.env.VITE_CATEGORY_IMAGES_BUCKET || 'category-images';

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  image_url: z.string().url().optional().or(z.literal("")),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

const CategoryManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      image_url: "",
    },
  });

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(profile?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchCategories();
    }
  }, [user]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const startTime = performance.now();
    
    console.log('📤 Starting category image upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      bucket: CATEGORY_IMAGES_BUCKET
    });

    try {
      // Verify bucket exists and is accessible
      console.log(`🔍 Verifying bucket '${CATEGORY_IMAGES_BUCKET}' exists...`);
      const { data: bucketData, error: bucketError } = await supabase.storage
        .getBucket(CATEGORY_IMAGES_BUCKET);
      
      if (bucketError) {
        const errorDetails = {
          bucket: CATEGORY_IMAGES_BUCKET,
          error: bucketError,
          message: bucketError.message,
          code: bucketError.statusCode || 'N/A',
          timestamp: new Date().toISOString()
        };
        
        console.error('❌ Bucket verification failed:', errorDetails);
        
        // Provide detailed error message based on error type
        let errorDescription = `The '${CATEGORY_IMAGES_BUCKET}' storage bucket is not available. `;
        
        if (bucketError.message?.includes('not found') || bucketError.statusCode === 404) {
          errorDescription += `Please create the bucket in Supabase Dashboard:\n1. Go to Storage in Supabase Dashboard\n2. Click "New bucket"\n3. Name it "${CATEGORY_IMAGES_BUCKET}"\n4. Set it to Public\n5. Save\n\nAlternatively, run the migration: supabase/migrations/20250120000001_add_category_images_bucket.sql`;
        } else if (bucketError.message?.includes('permission') || bucketError.statusCode === 403) {
          errorDescription += `You don't have permission to access this bucket. Please contact an administrator.`;
        } else {
          errorDescription += `Error: ${bucketError.message}. Check the console for details.`;
        }
        
        toast({
          title: "Storage Error",
          description: errorDescription,
          variant: "destructive",
          duration: 10000, // Show longer for detailed instructions
        });
        throw new Error(`Bucket '${CATEGORY_IMAGES_BUCKET}' is not accessible: ${bucketError.message}`);
      }

      console.log('✅ Bucket verified:', {
        bucket: CATEGORY_IMAGES_BUCKET,
        public: bucketData?.public || false,
        createdAt: bucketData?.created_at || 'N/A'
      });

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`; // Store directly in bucket root, no subfolder needed

      console.log(`⬆️  Uploading file to bucket:`, {
        bucket: CATEGORY_IMAGES_BUCKET,
        filePath,
        fileSize: file.size
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(CATEGORY_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload failed:', {
          error: uploadError,
          message: uploadError.message,
          code: uploadError.statusCode || 'N/A',
          bucket: CATEGORY_IMAGES_BUCKET,
          filePath
        });
        throw uploadError;
      }

      console.log('✅ Upload successful:', {
        path: uploadData?.path || filePath,
        bucket: CATEGORY_IMAGES_BUCKET
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(CATEGORY_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        console.error('❌ Failed to generate public URL:', {
          filePath,
          bucket: CATEGORY_IMAGES_BUCKET
        });
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('✅ Public URL generated:', {
        url: urlData.publicUrl,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      setImagePreview(urlData.publicUrl);
      form.setValue('image_url', urlData.publicUrl);
      setImageFile(file);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      const errorDetails = {
        error,
        message: error?.message || 'Unknown error',
        code: error?.statusCode || error?.code || 'N/A',
        bucket: CATEGORY_IMAGES_BUCKET,
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
          description: `The '${CATEGORY_IMAGES_BUCKET}' storage bucket does not exist. Please create it in the Supabase Dashboard under Storage (set to public), or run the migration to create it.`,
          variant: "destructive",
        });
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || error?.statusCode === 403) {
        toast({
          title: "Permission Denied",
          description: `You don't have permission to upload to the '${CATEGORY_IMAGES_BUCKET}' bucket. Please contact an administrator.`,
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid Image Type",
        description: "Please select a valid image file (JPEG, PNG, WebP, or GIF)",
        variant: "destructive",
      });
      // Reset the input
      e.target.value = '';
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
      // Reset the input
      e.target.value = '';
      return;
    }

    // Validate file dimensions (optional - prevent extremely large images)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDimension = 4000; // Max 4000px on either side
      if (img.width > maxDimension || img.height > maxDimension) {
        toast({
          title: "Image Too Large",
          description: `Image dimensions must be less than ${maxDimension}x${maxDimension}px. Current: ${img.width}x${img.height}px`,
          variant: "destructive",
        });
      } else {
        handleImageUpload(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: "Invalid Image File",
        description: "The selected file could not be loaded as an image. Please choose a valid image file.",
        variant: "destructive",
      });
      e.target.value = '';
    };
    img.src = objectUrl;
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    form.setValue('image_url', '');
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only admins can manage categories",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        // Only update image_url if a new value was provided (preserve existing if empty)
        const updateData: any = {
          name: data.name,
          description: data.description || null,
          slug: data.slug,
        };
        
        // Only update image_url if a new URL was provided (don't overwrite with empty)
        if (data.image_url && data.image_url.trim() !== '') {
          updateData.image_url = data.image_url;
        } else if (data.image_url === '') {
          // Explicitly clear image_url if user removed it
          updateData.image_url = null;
        }
        // If image_url is undefined/null, don't include it in update (preserves existing)
        
        console.log('💾 Updating category:', {
          categoryId: editingCategory.id,
          updateData,
          existingImageUrl: editingCategory.image_url
        });
        
        const { error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Category Updated",
          description: "The category has been updated successfully.",
        });
      } else {
        // Create new category
        const insertData: any = {
          name: data.name,
          description: data.description || null,
          slug: data.slug,
        };
        
        // Only include image_url if provided (allow null for new categories)
        if (data.image_url && data.image_url.trim() !== '') {
          insertData.image_url = data.image_url;
        }
        
        console.log('💾 Creating new category:', insertData);
        
        const { error } = await supabase
          .from('categories')
          .insert(insertData);

        if (error) throw error;

        toast({
          title: "Category Created",
          description: "The category has been created successfully.",
        });
      }

      setShowDialog(false);
      setEditingCategory(null);
      setImageFile(null);
      setImagePreview('');
      form.reset();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    const imageUrl = category.image_url || '';
    form.reset({
      name: category.name,
      description: category.description || "",
      slug: category.slug,
      image_url: imageUrl,
    });
    setImagePreview(imageUrl);
    setImageFile(null);
    setShowDialog(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully.",
      });
      
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. It might be in use by products.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (category: Category) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "Category Updated",
        description: `Category is now ${!category.is_active ? 'active' : 'inactive'}`,
      });
      
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category status",
        variant: "destructive",
      });
    }
  };

  if (!user || !isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">
            Only administrators can manage categories.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Category Management</h2>
          <p className="text-muted-foreground">{categories.length} categories total</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCategory(null);
              setImageFile(null);
              setImagePreview('');
              form.reset({
                name: "",
                description: "",
                slug: "",
                image_url: "",
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update the category information" : "Create a new category for products and services"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter category name" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editingCategory) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL identifier)</FormLabel>
                      <FormControl>
                        <Input placeholder="category-slug" {...field} />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe this category..."
                          className="min-h-[80px]"
                          {...field} 
                        />
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
                      <FormLabel>Category Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {imagePreview ? (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Category preview"
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-2">
                                Upload an image for this category
                              </p>
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageFileChange}
                                  className="hidden"
                                  disabled={uploading}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={uploading}
                                  asChild
                                >
                                  <span>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {uploading ? "Uploading..." : "Choose Image"}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Input
                              type="url"
                              placeholder="Or enter image URL"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value) {
                                  setImagePreview(e.target.value);
                                } else if (!imageFile) {
                                  setImagePreview('');
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              Upload an image file or provide an image URL
                            </p>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit">
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
              <div className="text-sm text-muted-foreground">
                Slug: <code className="bg-muted px-1 rounded">{category.slug}</code>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleToggleActive(category)}
                >
                  {category.is_active ? (
                    <EyeOff className="w-4 h-4 mr-1" />
                  ) : (
                    <Eye className="w-4 h-4 mr-1" />
                  )}
                  {category.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{category.name}"? This action cannot be undone and will affect all products using this category.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(category.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first category for organizing products and services.
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CategoryManager;