import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Facebook, 
  MessageCircle,
  Verified
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  island: string;
  phone: string;
  email: string;
  website: string;
  facebook_url: string;
  whatsapp: string;
  logo_url: string;
  cover_image_url: string;
  average_rating: number;
  total_reviews: number;
  featured: boolean;
  verified: boolean;
}

// Memoized BusinessCard component
const BusinessCard = React.memo(({ 
  business, 
  index 
}: { 
  business: Business; 
  index: number;
}) => {
  const formatCategory = useCallback((category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const handleViewDetails = useCallback(() => {
    window.location.href = `/directory?business=${business.id}`;
  }, [business.id]);

  const handlePhoneClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${business.phone}`;
  }, [business.phone]);

  const handleWhatsAppClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
  }, [business.whatsapp]);

  const handleWebsiteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(business.website, '_blank', 'noopener,noreferrer');
  }, [business.website]);

  const handleFacebookClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(business.facebook_url, '_blank', 'noopener,noreferrer');
  }, [business.facebook_url]);

  return (
    <Card 
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
            <Badge variant="outline" className="text-xs">
              {formatCategory(business.category)}
            </Badge>
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
        
        {business.average_rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{business.average_rating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground text-sm">
              ({business.total_reviews} review{business.total_reviews !== 1 ? 's' : ''})
            </span>
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
                onClick={handlePhoneClick}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            {business.whatsapp && (
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full w-9 h-9 p-0"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            {business.website && (
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full w-9 h-9 p-0"
                onClick={handleWebsiteClick}
              >
                <Globe className="h-4 w-4" />
              </Button>
            )}
            {business.facebook_url && (
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full w-9 h-9 p-0"
                onClick={handleFacebookClick}
              >
                <Facebook className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-primary hover:bg-primary-dark"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

BusinessCard.displayName = 'BusinessCard';

const OptimizedFeaturedListings = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFeaturedBusinesses = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const startTime = performance.now();
    console.log('🚀 FeaturedListings: Starting data fetch...');
    
    try {
      setDataLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .eq('featured', true)
        .order('average_rating', { ascending: false })
        .limit(6);

      if (error) {
        console.error('🚨 FeaturedListings: Query failed:', error);
        console.error('FeaturedListings Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        if (!signal.aborted) setBusinesses([]);
      } else {
        console.log('✅ FeaturedListings: Query successful, data:', data);
        if (!signal.aborted) setBusinesses(data || []);
      }

      const endTime = performance.now();
      console.log(`✅ FeaturedListings: Data fetch completed in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      // Don't set error if request was aborted
      if (signal.aborted) return;
      
      console.error('🚨 FeaturedListings: Exception caught:', error);
      console.error('Exception type:', typeof error);
      console.error('Exception instanceof Error:', error instanceof Error);
      if (error instanceof Error) {
        console.error('Exception message:', error.message);
        console.error('Exception stack:', error.stack);
      }
      setBusinesses([]);
    } finally {
      if (!signal.aborted) {
        setDataLoading(false);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const startTime = performance.now();
    console.log('🚀 FeaturedListings: Component mounting...');
    
    fetchFeaturedBusinesses();
    
    const endTime = performance.now();
    console.log(`✅ FeaturedListings: Component mounted in ${(endTime - startTime).toFixed(2)}ms`);
    
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchFeaturedBusinesses]);

  const handleViewAllClick = useCallback(() => {
    window.location.href = '/directory';
  }, []);

  // Memoized skeleton component
  const skeletonCards = useMemo(() => (
    [...Array(3)].map((_, i) => (
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
    ))
  ), []);

  // Show skeleton only during data loading
  if (dataLoading) {
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {skeletonCards}
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
              Featured businesses will appear here as they join our directory
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
            <BusinessCard
              key={business.id}
              business={business}
              index={index}
            />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="outline" 
            className="hover:bg-primary hover:text-primary-foreground"
            onClick={handleViewAllClick}
          >
            View All Businesses
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OptimizedFeaturedListings;
