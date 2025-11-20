import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Lazy load heavy map components
const MinimalLocationInput = lazy(() => import('@/components/MinimalLocationInput'));
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Building, 
  MapPin, 
  Plus
} from 'lucide-react';

const BusinessCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    status: 'draft',
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


  const categories = [
    'restaurants', 'hotels', 'tourism', 'retail', 'services',
    'entertainment', 'health', 'education', 'finance', 'transport',
    'real_estate', 'technology'
  ];

  const islands = [
    'Mahé', 'Praslin', 'La Digue', 'Silhouette', 'Curieuse', 
    'Bird', 'Denis', 'Fregate', 'North Island', 'Desroches'
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' }
  ];

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `business-logos/${fileName}`;

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
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
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
      // Debug: Log form data
      console.log('Form data being submitted:', formData);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
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

      // Prepare insert data - only use valid database fields
      // NEVER use undefined - use null for optional fields
      const insertData: Record<string, any> = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        status: formData.status === 'draft' ? 'pending' : formData.status, // 'draft' is not valid, use 'pending'
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        address: formData.address || null,
        island: formData.island || null,
        latitude: latitude,
        longitude: longitude,
        logo_url: formData.logo_url || null,
        owner_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Insert data prepared:', insertData);

      const { data, error } = await supabase
        .from('businesses')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Business created successfully:', data);

      toast({
        title: "Success",
        description: "Business created successfully",
      });

      navigate(`/admin/businesses/edit/${data.id}`);
    } catch (error) {
      console.error('Error creating business:', error);
      
      // More specific error messages
      let errorMessage = "Failed to create business";
      if (error instanceof Error) {
        if (error.message.includes('User not authenticated')) {
          errorMessage = "Please log in to create a business";
        } else if (error.message.includes('duplicate key')) {
          errorMessage = "A business with this name already exists";
        } else if (error.message.includes('violates')) {
          errorMessage = "Please check all required fields are filled";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-bold">Create New Business</h1>
            <p className="text-muted-foreground">Add a new business to the platform</p>
          </div>
        </div>
      </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                    placeholder="Enter business name"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+248 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                    placeholder="business@example.com"
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={errors.website ? 'border-red-500' : ''}
                  placeholder="https://www.example.com"
                />
                {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
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
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading location input...</span>
                  </div>
                </div>
              }>
                <MinimalLocationInput
                  address={formData.address}
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onAddressChange={handleAddressChange}
                  onLatitudeChange={handleLatitudeChange}
                  onLongitudeChange={handleLongitudeChange}
                  onCoordinateSourceChange={(source) => {
                    // Optional: track coordinate source for debugging
                    console.debug('[BusinessCreate] Coordinate source changed:', source);
                  }}
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
                    onClick={() => {
                      setLogoPreview('');
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
                {logoFile && (
                  <Button
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

          {/* Save Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {saving ? 'Creating...' : 'Create Business'}
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

export default BusinessCreate;
