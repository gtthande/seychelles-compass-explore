import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, Star } from "lucide-react";
import { useLiveCounters } from "@/hooks/useLiveCounters";
import { useHeroSection } from "@/hooks/useHeroSection";
import SearchWithTypeahead from "@/components/SearchWithTypeahead";
import { useState } from "react";
// Hero image is now persistently stored in public/assets/hero.jpg

const Hero = () => {
  const { counters, loading } = useLiveCounters();
  const { heroSection, loading: heroLoading } = useHeroSection();
  const [searchValue, setSearchValue] = useState("");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Seychelles Beach Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ 
          backgroundImage: heroSection?.image_url 
            ? `url(${heroSection.image_url})` 
            : `url(/assets/hero.jpg)`
        }}
      />
      
      {/* Tropical overlay for readability */}
      <div className="absolute inset-0" style={{ background: 'var(--hero-overlay)' }} />
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-foreground">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {heroLoading ? (
            <div className="space-y-6">
              <div className="animate-pulse">
                <div className="h-16 md:h-20 bg-muted rounded w-3/4 mx-auto mb-6"></div>
                <div className="h-6 md:h-8 bg-muted rounded w-1/2 mx-auto mb-8"></div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                {heroSection?.title || 'Welcome to iCompass Seychelles'}
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {heroSection?.subtitle || 'Find trusted businesses, discover local services, and explore everything Seychelles has to offer'}
              </p>
            </>
          )}
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative bg-card/95 backdrop-blur-sm border border-border/50 rounded-full p-2" style={{ boxShadow: 'var(--card-shadow)' }}>
              <SearchWithTypeahead
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Discover Seychelles businesses & services..."
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-slide-up">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold text-foreground">
                  {loading ? (
                    <div className="animate-pulse bg-muted rounded w-12 h-8 mx-auto" />
                  ) : (
                    `${counters.businesses}+`
                  )}
                </span>
              </div>
              <p className="text-muted-foreground">Trusted Businesses</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold text-foreground">15+</span>
              </div>
              <p className="text-muted-foreground">Islands Covered</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold text-foreground">
                  {loading ? (
                    <div className="animate-pulse bg-muted rounded w-12 h-8 mx-auto" />
                  ) : counters.reviews > 0 ? (
                    "4.8"
                  ) : (
                    "New"
                  )}
                </span>
              </div>
              <p className="text-muted-foreground">Quality Rating</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tropical scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-card/60 backdrop-blur-sm rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;