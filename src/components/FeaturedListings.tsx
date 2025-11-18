import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";
import { Business } from "@/types/business";
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Facebook, 
  MessageCircle,
  Verified
} from "lucide-react";

const FeaturedListings = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFeaturedBusinesses = async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      setLoading(true);
      
      // Use lean query with only required fields
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          category,
          status,
          address,
          island,
          latitude,
          longitude,
          featured,
          verified,
          logo_url,
          cover_image_url,
          average_rating,
          total_reviews,
          description,
          phone,
          whatsapp,
          email,
          website,
          facebook_url
        `)
        .eq('status', 'active')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (signal.aborted) return;

      if (error) {
        console.error('Error fetching featured businesses:', error);
        setBusinesses([]);
      } else {
        setBusinesses(data || []);
      }
    } catch (error) {
      // Don't set error if request was aborted
      if (signal.aborted) return;
      
      console.error('Error:', error);
      setBusinesses([]);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFeaturedBusinesses();
    
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatCategory = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Featured Businesses
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover trusted and verified businesses in Seychelles
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Featured Businesses
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              No featured businesses yet. Featured businesses will appear here as they join our directory.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Featured Businesses
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Trusted Local Partners
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover verified businesses that are trusted by the community
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {businesses.map((business, index) => (
            <Card 
              key={business.id}
              className="group cursor-pointer hover:shadow-card-hover transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Only show cover image if business uploaded one */}
              {business.cover_image_url && (
                <div className="relative">
                  <OptimizedImage
                    src={business.cover_image_url}
                    alt={business.name}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {business.featured && (
                      <Badge className="bg-primary text-primary-foreground">
                        Featured
                      </Badge>
                    )}
                    {business.verified && (
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        <Verified className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {business.name}
                    </h3>
                    {business.category && (
                      <Badge variant="outline" className="text-xs">
                        {formatCategory(business.category)}
                      </Badge>
                    )}
                    {!business.cover_image_url && (
                      <div className="flex gap-1 mt-2">
                        {business.featured && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Featured
                          </Badge>
                        )}
                        {business.verified && (
                          <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                            <Verified className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {business.logo_url && (
                    <OptimizedImage
                      src={business.logo_url}
                      alt={`${business.name} logo`}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover ml-3"
                      sizes="48px"
                      loading="lazy"
                    />
                  )}
                </div>
                
                {business.average_rating && business.average_rating > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">{business.average_rating.toFixed(1)}</span>
                    </div>
                    {business.total_reviews && business.total_reviews > 0 && (
                      <span className="text-muted-foreground text-sm">
                        ({business.total_reviews} review{business.total_reviews !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                )}
                
                {(business.address || business.island) && (
                  <div className="flex items-center gap-1 mb-4 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {business.address}
                      {business.address && business.island && ', '}
                      {business.island}
                    </span>
                  </div>
                )}
                
                {business.description && (
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                    {business.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {business.phone && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full w-9 h-9 p-0"
                        asChild
                      >
                        <a href={`tel:${business.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {business.whatsapp && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full w-9 h-9 p-0"
                        asChild
                      >
                        <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {business.website && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full w-9 h-9 p-0"
                        asChild
                      >
                        <a href={business.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {business.facebook_url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full w-9 h-9 p-0"
                        asChild
                      >
                        <a href={business.facebook_url} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-primary hover:bg-primary-dark"
                    onClick={() => window.location.href = `/directory?business=${business.id}`}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="outline" 
            className="hover:bg-primary hover:text-primary-foreground"
            onClick={() => window.location.href = '/directory'}
          >
            View All Businesses
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;