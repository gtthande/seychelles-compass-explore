import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import BusinessStatusBadge from '@/components/ui/BusinessStatusBadge';
import MinimalLocationInput from '@/components/MinimalLocationInput';
import BusinessProductAssignments from '@/components/admin/BusinessProductAssignments';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Business {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  island: string;
  latitude: number | null;
  longitude: number | null;
  logo_url: string;
  cover_image_url: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  verification_notes?: string;
}

const BusinessEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  // Use ref to track if we've already fetched to prevent re-fetch loops
  const hasFetchedRef = useRef(false);

  // Form state
  // CRITICAL: status default must be 'pending' not 'draft' (draft is not a valid enum)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    status: 'pending',
    phone: '',
    email: '',
    website: '',
    address: '',
    island: '',
    latitude: '',
    longitude: '',
    verification_notes: ''
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

  // CRITICAL: Status must match database enum: 'active', 'pending', 'suspended', 'closed'
  // Note: 'draft' is NOT a valid enum value - use 'pending' instead
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'closed', label: 'Closed' }
  ];

  useEffect(() => {
    // Only fetch once per id change, using ref to prevent re-fetch loops
    if (id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchBusiness();
    }
    // Reset ref when id changes
    return () => {
      if (id) {
        hasFetchedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id to prevent re-fetch loops

  const fetchBusiness = async () => {
    if (!id || (hasFetchedRef.current && business)) {
      // Don't fetch if we already have the data
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.debug('🔍 [BusinessEdit] Fetching business:', id);
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ [BusinessEdit] Supabase fetch error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          businessId: id,
        });
        throw error;
      }

      console.debug('🔍 [BusinessEdit] Business data received:', {
        hasData: !!data,
        businessId: data?.id,
        name: data?.name,
      });

      // Only update if we got new data
      if (data) {
        setBusiness(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          // CRITICAL: Default to 'pending' not 'draft' (draft is not a valid enum)
          status: data.status || 'pending',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          address: data.address || '',
          island: data.island || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          verification_notes: data.verification_notes || ''
        });

        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      }
    } catch (error: any) {
      console.error('❌ [BusinessEdit] Error fetching business:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        businessId: id,
      });
      toast({
        title: "Error",
        description: `Failed to load business data: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = React.useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []); // Stable callback to prevent re-renders

  // Memoize location input callbacks to prevent re-renders
  const handleAddressChange = React.useCallback((address: string) => {
    handleInputChange('address', address);
  }, [handleInputChange]);

  const handleLatitudeChange = React.useCallback((latitude: string) => {
    handleInputChange('latitude', latitude);
  }, [handleInputChange]);

  const handleLongitudeChange = React.useCallback((longitude: string) => {
    handleInputChange('longitude', longitude);
  }, [handleInputChange]);

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
      // Parse and validate latitude/longitude - only from formData fields
      // These are already validated by the form, but we ensure they're numbers or null
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

      // Prepare update data - only use valid database fields
      // NEVER use undefined - use null for optional fields
      // NEVER use empty strings - convert to null
      const updateData: Record<string, any> = {
        name: formData.name,
        description: formData.description?.trim() || null,
        category: formData.category,
        status: formData.status,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        address: formData.address?.trim() || null,
        island: formData.island?.trim() || null,
        verification_notes: formData.verification_notes?.trim() || null,
        updated_at: new Date().toISOString()
      };

      // Only include latitude/longitude - these are the ONLY coordinate fields
      // If both are null, we still include them as null (clears coordinates)
      // NEVER use lat, lng, location_lat, location_lng, coords, etc.
      updateData.latitude = latitude;
      updateData.longitude = longitude;

      // Log update attempt for debugging
      console.debug('💾 [BusinessEdit] Attempting to update business', {
        businessId: id,
        updateData,
        timestamp: new Date().toISOString()
      });

      // Get current user to verify admin status
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Verify admin status before update
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .or(`id.eq.${currentUser.id},user_id.eq.${currentUser.id}`)
        .maybeSingle();

      const isAdmin = profile?.is_admin === true || profile?.role === 'admin';
      
      if (!isAdmin) {
        // Check if user owns the business
        const { data: business } = await supabase
          .from('businesses')
          .select('owner_id')
          .eq('id', id)
          .single();
        
        if (business?.owner_id !== currentUser.id && business?.owner_id !== profile?.id) {
          throw new Error('Permission denied. You must be an admin or the business owner to update this business.');
        }
      }

      const { data, error, status } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      // CRITICAL: Always log the update response
      console.debug('📥 [BusinessEdit] Update response', {
        status,
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        businessId: id,
      });

      if (error) {
        // CRITICAL: Comprehensive error logging - MUST appear in console
        console.error('Business update error:', error);
        console.error('❌ [BusinessEdit] Supabase update error', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status,
          businessId: id,
          updateData,
          sanitizedPayload: updateData,
          payloadKeys: Object.keys(updateData),
          payloadValues: Object.values(updateData),
        });
        throw error;
      }

      if (!data) {
        console.error('❌ [BusinessEdit] Update returned no data', {
          status,
          businessId: id,
          updateData,
        });
        throw new Error('Update succeeded but no data returned. Please refresh and try again.');
      }

      console.debug('✅ [BusinessEdit] Business updated successfully', {
        businessId: id,
        updatedName: data.name,
      });

      // Update local state with saved data (but don't trigger re-fetch)
      if (data) {
        setBusiness(data);
        // Only update latitude/longitude in formData to avoid triggering unnecessary re-renders
        setFormData(prev => ({
          ...prev,
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
        }));
      }

      toast({
        title: "Success",
        description: "Business updated successfully",
        duration: 3000,
      });

      // Navigate immediately after showing toast (no delay to prevent refresh loops)
      // Use replace to avoid adding to history stack
      navigate('/admin', { replace: true });
    } catch (error: any) {
      // CRITICAL: Always log errors and ensure saving state is cleared
      console.error('Business update error:', error);
      console.error('❌ [BusinessEdit] Error updating business', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
        businessId: id,
        formData: {
          ...formData,
          latitude: latitude,
          longitude: longitude
        },
        rawPayload: {
          ...formData,
          latitude: latitude,
          longitude: longitude,
        }
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to update business";
      if (error?.code === '42501') {
        errorMessage = "Permission denied. You may not have permission to update this business.";
      } else if (error?.code === '23505') {
        errorMessage = "A business with this information already exists.";
      } else if (error?.code === '23502') {
        errorMessage = "Required field is missing. Please check all required fields.";
      } else if (error?.code === '23503') {
        errorMessage = "Invalid reference. Please check foreign key relationships.";
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      // CRITICAL: Always clear saving state, even on error
      setSaving(false);
      console.debug('🔍 [BusinessEdit] Save operation completed, saving state cleared');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id)
        .select(); // Return deleted row to verify deletion

      // Log detailed error information
      if (error) {
        console.error('❌ BusinessEdit: Failed to delete business', {
          businessId: id,
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status
        });
        
        // Check if it's an RLS policy issue
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          throw new Error('You do not have permission to delete this business. Only admins or business owners can delete businesses.');
        }
        
        throw new Error(error.message || 'Failed to delete business');
      }

      // Verify deletion
      if (!data || data.length === 0) {
        console.warn('⚠️ BusinessEdit: Delete returned no data, business may not exist', { businessId: id });
        toast({
          title: "Warning",
          description: "Business may have already been deleted or does not exist.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Business deleted successfully",
        });
      }

      // Navigate away after a short delay to show the toast
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (error: any) {
      console.error('❌ BusinessEdit: Error deleting business', {
        businessId: id,
        error,
        message: error?.message,
        stack: error?.stack
      });
      
      toast({
        title: "Failed to Delete Business",
        description: error?.message || "An error occurred while deleting the business. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Business...</CardTitle>
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

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Business Not Found</CardTitle>
            <CardDescription>The business you're looking for doesn't exist.</CardDescription>
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
            <h1 className="text-2xl font-bold">Edit Business</h1>
            <p className="text-muted-foreground">Update business information and settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BusinessStatusBadge status={formData.status} />
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
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
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleInputChange('name', e.target.value);
                    }}
                    className={errors.name ? 'border-red-500' : ''}
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
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInputChange('description', e.target.value);
                  }}
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
                    type="text"
                    value={formData.phone}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleInputChange('phone', e.target.value);
                    }}
                    placeholder="+248 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleInputChange('email', e.target.value);
                    }}
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
                  type="text"
                  value={formData.website}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInputChange('website', e.target.value);
                  }}
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
              <MinimalLocationInput
                address={formData.address}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onAddressChange={handleAddressChange}
                onLatitudeChange={handleLatitudeChange}
                onLongitudeChange={handleLongitudeChange}
                onIslandChange={(island) => handleInputChange('island', island)}
                onCoordinateSourceChange={(source) => {
                  // Optional: track coordinate source for debugging
                  console.debug('[BusinessEdit] Coordinate source changed:', source);
                }}
              />

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

          {/* Verification Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Notes</CardTitle>
              <CardDescription>Internal notes for business verification</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.verification_notes}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleInputChange('verification_notes', e.target.value);
                }}
                rows={3}
                placeholder="Add verification notes..."
              />
            </CardContent>
          </Card>

          {/* Assigned Products */}
          {business && (
            <BusinessProductAssignments businessId={business.id} />
          )}
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
                    alt="Business logo"
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave();
                  }}
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

export default BusinessEdit;
