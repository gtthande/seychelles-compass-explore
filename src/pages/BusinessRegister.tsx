import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Upload, X, MapPin, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Lazy load heavy map components
const MinimalLocationInput = lazy(() => import('@/components/MinimalLocationInput'));

interface Category {
  id: string;
  title: string;
  slug: string;
}

const BusinessRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    island: '',
    latitude: '',
    longitude: '',
    logo_url: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const islands = [
    'Mahé', 'Praslin', 'La Digue', 'Silhouette', 'Curieuse', 
    'Bird', 'Denis', 'Fregate', 'North Island', 'Desroches'
  ];

  // Load categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, title, slug')
          .eq('is_active', true)
          .order('title');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to load categories. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  // Location input handlers
  const handleAddressChange = (address: string) => {
    handleInputChange('address', address);
  };

  const handleLatitudeChange = (latitude: string) => {
    handleInputChange('latitude', latitude);
  };

  const handleLongitudeChange = (longitude: string) => {
    handleInputChange('longitude', longitude);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL (include http:// or https://)';
    }

    if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        throw new Error('Invalid image type. Please select a JPEG, PNG, WebP, or GIF image.');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error(`Image must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `business-logos/${fileName}`;

      // Verify bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage
        .getBucket('business-logos');

      if (bucketError) {
        throw new Error(`Storage bucket is not available: ${bucketError.message}`);
      }

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      setLogoPreview(data.publicUrl);
      setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
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
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register a business",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)  // Fixed: use id (primary key) not user_id
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found. Please complete your profile first.');
      }

      // Upload logo if provided but not yet uploaded
      let logoUrl = formData.logo_url;
      if (logoFile && !logoUrl) {
        await handleLogoUpload(logoFile);
        logoUrl = formData.logo_url;
      }

      // Parse and validate coordinates - only use valid numbers or null
      const parseCoordinate = (value: string | null | undefined): number | null => {
        if (!value || !value.trim()) return null;
        const num = Number(value.trim());
        return isNaN(num) ? null : num;
      };

      const latitude = parseCoordinate(formData.latitude);
      const longitude = parseCoordinate(formData.longitude);

      // Validate ranges if coordinates are provided
      if (latitude !== null && (latitude < -90 || latitude > 90)) {
        throw new Error('Latitude must be between -90 and 90');
      }
      if (longitude !== null && (longitude < -180 || longitude > 180)) {
        throw new Error('Longitude must be between -180 and 180');
      }

      // Find category_id from category slug
      const selectedCategory = categories.find(cat => cat.slug === formData.category);
      if (!selectedCategory) {
        throw new Error('Invalid category selected');
      }

      // HYBRID APPROVAL MODEL (Option C): 
      // - Admin-created businesses start as 'approved' (is_verified=true, is_active=true)
      // - Public user-created businesses start as 'pending' (is_verified=false, is_active=false)
      const is_verified = isAdmin ? true : false;
      const is_active = isAdmin ? true : false;
      const status = isAdmin ? 'approved' : 'pending';

      // Prepare insert data - only use valid database fields
      // NEVER use undefined - use null for optional fields
      const insertData: Record<string, any> = {
        title: formData.name.trim(), // Map form 'name' to database 'title'
        description: formData.description.trim() || null,
        category_id: selectedCategory.id, // Map form 'category' (slug) to database 'category_id' (UUID)
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
        island: formData.island || null,
        latitude: latitude,
        longitude: longitude,
        image_url: logoUrl || null, // Use image_url instead of logo_url
        owner_id: profile.id,
        status: status, // Set status based on user role
        is_verified: is_verified,
        is_active: is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      // Success message based on verification status
      const successMessage = isAdmin 
        ? "Business created successfully and is now active."
        : "Business added successfully! It is now pending approval by an administrator.";

      toast({
        title: "Success",
        description: successMessage,
      });

      // Redirect based on user role
      if (isAdmin) {
        navigate(`/admin/businesses/edit/${data.id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error creating business:', error);
      
      let errorMessage = "Failed to create business";
      let errorTitle = "Error";
      
      // Handle different error types
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('user profile not found') || errorMsg.includes('profile')) {
          errorMessage = "Please complete your profile first. Try logging out and back in.";
          errorTitle = "Profile Required";
        } else if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
          errorMessage = "A business with this name already exists. Please choose a different name.";
          errorTitle = "Duplicate Business";
        } else if (errorMsg.includes('violates') || errorMsg.includes('constraint')) {
          errorMessage = "Please check all required fields are filled correctly.";
          errorTitle = "Validation Error";
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
          errorTitle = "Connection Error";
        } else if (errorMsg.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
          errorTitle = "Timeout Error";
        } else if (error.code === 'PGRST301' || errorMsg.includes('not found')) {
          errorMessage = "Database connection error. Please try again later.";
          errorTitle = "Database Error";
        } else {
          errorMessage = error.message || "An unexpected error occurred. Please try again.";
        }
      } else if (error?.code) {
        // Handle Supabase error codes
        switch (error.code) {
          case 'PGRST301':
            errorMessage = "Database table not found. Please contact support.";
            errorTitle = "Database Error";
            break;
          case '23505':
            errorMessage = "A business with this name already exists.";
            errorTitle = "Duplicate Entry";
            break;
          case '23503':
            errorMessage = "Invalid category or reference. Please select a valid category.";
            errorTitle = "Invalid Data";
            break;
          default:
            errorMessage = error.message || "Failed to create business. Please try again.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Building className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">Register Your Business</h1>
          <p className="text-muted-foreground">
            Join the iCompass Business Directory and connect with customers across Seychelles
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-destructive' : ''}
                      placeholder="Enter business name"
                      required
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    {loadingCategories ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading categories...</span>
                      </div>
                    ) : (
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                              {category.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      placeholder="Describe your business..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+248 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                        placeholder="business@example.com"
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={errors.website ? 'border-destructive' : ''}
                      placeholder="https://www.example.com"
                    />
                    {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-16">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  }>
                    <MinimalLocationInput
                      address={formData.address}
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onAddressChange={handleAddressChange}
                      onLatitudeChange={handleLatitudeChange}
                      onLongitudeChange={handleLongitudeChange}
                      onIslandChange={(island) => handleInputChange('island', island)}
                    />
                  </Suspense>

                  <div className="space-y-2">
                    <Label htmlFor="island">Island</Label>
                    <Select value={formData.island} onValueChange={(value) => handleInputChange('island', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select island" />
                      </SelectTrigger>
                      <SelectContent>
                        {islands.map((island) => (
                          <SelectItem key={island} value={island}>
                            {island}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Logo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {logoPreview && (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Business logo preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        type="button"
                        onClick={() => {
                          setLogoPreview('');
                          setLogoFile(null);
                          setFormData(prev => ({ ...prev, logo_url: '' }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo">Upload Logo</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setLogoPreview(e.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload an image (JPEG, PNG, GIF, WebP; max 5MB)
                    </p>
                    {logoFile && !logoPreview.includes('http') && (
                      <Button
                        type="button"
                        onClick={() => handleLogoUpload(logoFile)}
                        disabled={uploading}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Button
                      type="submit"
                      disabled={saving || uploading}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Business
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/')}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Your business will be reviewed by an administrator before being published.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>


      <Footer />
    </div>
  );
};

export default BusinessRegister;

