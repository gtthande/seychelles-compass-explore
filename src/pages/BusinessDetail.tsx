import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Star,
  Navigation,
  ExternalLink,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  island: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  opening_hours: string;
  average_rating: number;
  total_reviews: number;
  verified: boolean;
  featured: boolean;
  logo_url: string;
  cover_image_url: string;
  gallery_images: string[];
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  whatsapp: string;
  created_at: string;
  updated_at: string;
}

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBusiness(id);
    }
  }, [id]);

  const fetchBusiness = async (businessId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching business:', error);
        setError('Business not found');
        return;
      }

      setBusiness(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const formatCategory = (category: string) => {
    const categoryLabels: Record<string, string> = {
      food: 'Food & Beverages',
      accommodation: 'Accommodation',
      tours: 'Tours & Activities',
      transport: 'Transportation',
      retail: 'Retail Products',
      services: 'Services',
      entertainment: 'Entertainment',
      education: 'Education',
      diving: 'Diving',
      hotels: 'Hotels',
      restaurant: 'Restaurant',
      other: 'Other'
    };
    return categoryLabels[category] || category;
  };

  const getGoogleMapsUrl = () => {
    if (business?.latitude && business?.longitude) {
      return `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
    } else if (business?.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ', ' + business.island)}`;
    }
    return null;
  };

  const getStaticMapUrl = () => {
    if (!business?.latitude || !business?.longitude) return null;
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    return `https://maps.googleapis.com/maps/api/staticmap?center=${business.latitude},${business.longitude}&zoom=15&size=600x300&markers=color:red%7C${business.latitude},${business.longitude}&key=${apiKey}`;
  };

  const getEmbedMapUrl = () => {
    if (!business?.latitude || !business?.longitude) return null;
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${business.latitude},${business.longitude}&zoom=15`;
  };

  const handleGetDirections = () => {
    const mapsUrl = getGoogleMapsUrl();
    if (mapsUrl) {
      window.open(mapsUrl, '_blank');
    } else {
      toast({
        title: "Directions unavailable",
        description: "Location information is not available for this business.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Business Not Found</CardTitle>
            <CardDescription>
              {error || 'The business you are looking for does not exist or has been removed.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/directory')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/directory')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{business.name}</h1>
                {business.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                )}
                {business.featured && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Badge variant="outline">{formatCategory(business.category)}</Badge>
                {business.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">
                      {business.average_rating.toFixed(1)} ({business.total_reviews} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {business.description}
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`tel:${business.phone}`}
                      className="text-primary hover:underline"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}
                
                {business.whatsapp && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      WhatsApp: {business.whatsapp}
                    </a>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${business.email}`}
                      className="text-primary hover:underline"
                    >
                      {business.email}
                    </a>
                  </div>
                )}

                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            {(business.facebook_url || business.instagram_url || business.linkedin_url || business.youtube_url) && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {business.facebook_url && (
                      <a 
                        href={business.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Facebook
                      </a>
                    )}
                    {business.instagram_url && (
                      <a 
                        href={business.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-pink-100 text-pink-800 rounded-lg hover:bg-pink-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Instagram
                      </a>
                    )}
                    {business.linkedin_url && (
                      <a 
                        href={business.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {business.youtube_url && (
                      <a 
                        href={business.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        YouTube
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{business.address}</p>
                  <p className="text-muted-foreground">{business.island}</p>
                </div>
                
                <Button onClick={handleGetDirections} className="w-full">
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>

                {getEmbedMapUrl() && (
                  <div className="mt-4">
                    <iframe
                      src={getEmbedMapUrl()!}
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opening Hours */}
            {business.opening_hours && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Opening Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {business.opening_hours}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business.phone && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${business.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </a>
                  </Button>
                )}
                
                {business.whatsapp && (
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}

                {business.email && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${business.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
