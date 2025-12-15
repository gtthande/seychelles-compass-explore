import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Phone, Globe, MapPin, Clock, Share2, Heart, Navigation, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BusinessLocationCard from '@/components/BusinessLocationCard';
import LocationCard from '@/components/LocationCard';
import { useToast } from '@/hooks/use-toast';
import { useServerSideData } from '@/hooks/useOptimizedData';
import { useAuth } from '@/hooks/useAuth';

interface Business {
  id: string;
  owner_id?: string;
  title: string;
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

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  duration: string | null;
  is_active: boolean;
}

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Array<{ product: Product }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Memoize user ID to prevent unnecessary re-fetches
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) {
        setError('Business ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('businesses')
          .select(`
            id, owner_id, title, description, category, address, latitude, longitude, island,
            phone, website, email, facebook_url, instagram_url, opening_hours,
            average_rating, total_reviews, featured, verified, logo_url, cover_image_url,
            gallery_images, services, status
          `)
          .eq('id', id)
          .eq('status', 'active')
          .single();

        if (fetchError) {
          console.error('Error fetching business:', fetchError);
          setError('Business not found');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Business not found');
          setLoading(false);
          return;
        }

        setBusiness(data);
        
        // Fetch products using business_products joined to products
        // Note: products table uses 'name' column (NOT 'title')
        const { data: productsData, error: productsError } = await supabase
          .from('business_products')
          .select('product:products(id,name,description,price,image_url,duration,is_active)')
          .eq('business_id', id)
          .eq('is_active', true);

        if (productsError) {
          console.error('Error fetching products:', productsError);
        } else {
          setProducts((productsData || []) as Array<{ product: Product }>);
        }
        
        // Check if current user is the owner (only if user exists and business has owner_id)
        if (userId && data.owner_id) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', userId)  // Fixed: use id (primary key) not user_id
              .single();
            
            setIsOwner(profile?.id === data.owner_id);
          } catch (profileError) {
            // Silently fail owner check - not critical
            setIsOwner(false);
          }
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        setError('Failed to load business details');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id, userId]);

  // Memoize category formatting
  const formattedCategory = useMemo(() => {
    if (!business?.category) return '';
    return business.category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [business?.category]);

  // Memoize share handler
  const handleShare = useCallback(async () => {
    if (!business) return;
    
    if (navigator.share && business) {
      try {
        await navigator.share({
          title: business.title,
          text: business.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error - ignore
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Business link copied to clipboard",
        });
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [business, toast]);

  // Memoize navigation handlers
  const handleBack = useCallback(() => {
    navigate('/directory');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (business) {
      navigate(`/business-dashboard?edit=${business.id}`);
    }
  }, [business, navigate]);

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
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{business.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{formattedCategory}</Badge>
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
                onClick={handleEdit}
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
                    alt={business.title}
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
                        alt={`${business.title} gallery ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Products */}
            {products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Products & Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((item, index) => {
                      const product = item.product;
                      if (!product) return null;
                      return (
                        <div key={product.id || index} className="border rounded-lg p-4 space-y-2">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-lg mb-2"
                            />
                          )}
                          <h3 className="font-semibold">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {product.price && (
                              <span className="font-medium">SCR {product.price.toFixed(2)}</span>
                            )}
                            {product.duration && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {product.duration}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
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