import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Phone, Globe, MapPin, Clock, Share2, Heart, Navigation, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BusinessLocationCard from '@/components/BusinessLocationCard';
import LocationCard from '@/components/LocationCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Business {
  id: string;
  owner_id?: string;
  name: string;
  description?: string;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  island?: string;
  phone?: string;
  website?: string;
  email?: string;
  facebook_url?: string;
  instagram_url?: string;
  opening_hours?: any;
  average_rating?: number;
  total_reviews?: number;
  featured?: boolean;
  verified?: boolean;
  logo_url?: string;
  cover_image_url?: string;
  gallery_images?: string[];
  services?: string[];
}

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) {
        setError('Business ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('businesses')
          .select(`
            id, owner_id, name, description, category, address, latitude, longitude, island,
            phone, website, email, facebook_url, instagram_url, opening_hours,
            average_rating, total_reviews, featured, verified, logo_url, cover_image_url,
            gallery_images, services
          `)
          .eq('id', id)
          .eq('status', 'active')
          .single();

        if (fetchError) {
          console.error('Error fetching business:', fetchError);
          setError('Business not found');
          return;
        }

        setBusiness(data);
        
        // Check if current user is the owner
        if (user && data.owner_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (profile && profile.id === data.owner_id) {
            setIsOwner(true);
          }
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        setError('Failed to load business details');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id, user]);

  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleShare = async () => {
    if (navigator.share && business) {
      try {
        await navigator.share({
          title: business.name,
          text: business.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Business link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded-lg"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-muted rounded-lg"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/directory')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/directory')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{business.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{formatCategory(business.category)}</Badge>
              {business.featured && (
                <Badge variant="default">Featured</Badge>
              )}
              {business.verified && (
                <Badge variant="outline">Verified</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/business-dashboard?edit=${business.id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Business
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Business Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {business.cover_image_url && (
              <Card>
                <CardContent className="p-0">
                  <img
                    src={business.cover_image_url}
                    alt={business.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {business.description || 'No description available.'}
                </p>
              </CardContent>
            </Card>

            {/* Services */}
            {business.services && business.services.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((service, index) => (
                      <Badge key={index} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Gallery */}
            {business.gallery_images && business.gallery_images.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {business.gallery_images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${business.name} gallery ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Right Column - Location & Contact */}
          <div className="space-y-6">
            {/* Rating */}
            {business.average_rating && business.total_reviews && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(business.average_rating!)
                              ? 'text-yellow-400 fill-current'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">
                      {business.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({business.total_reviews} reviews)
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location & Contact */}
            <LocationCard
              id={business.id}
              latitude={business.latitude}
              longitude={business.longitude}
              address={business.address}
              website={business.website}
              phone={business.phone}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;