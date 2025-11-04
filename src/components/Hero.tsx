import React, { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, Star, ArrowDown, Loader2 } from "lucide-react";
import { useLiveCounters } from "@/hooks/useLiveCounters";
import { useHeroSection } from "@/hooks/useHeroSection";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "@/components/OptimizedImage";

// Lazy load heavy search component
const SearchWithTypeahead = lazy(() => import("@/components/SearchWithTypeahead"));

const Hero = () => {
  const { counters, loading } = useLiveCounters();
  const { heroSection, loading: heroLoading } = useHeroSection();
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  // Handle search navigation
  const handleSearch = (searchTerm: string) => {
    navigate(`/directory?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-32 pb-16 md:pb-20">
      {/* Optimized Background Image */}
      <div className="absolute inset-0">
        <OptimizedImage
          src="/assets/hero.jpg"
          alt="Seychelles beautiful landscape"
          className="w-full h-full object-cover"
          priority={true}
          loading="eager"
          sizes="100vw"
        />
      </div>
      
      {/* Subtle Gradient Overlay for Text Readability */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.1) 100%)'
        }}
      />
      
      {/* Floating Elements for Visual Appeal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-primary/20 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-accent/30 rounded-full blur-md animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white pt-4 md:pt-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Text - Clean without overlay */}
          <div className="p-6 md:p-8 lg:p-12">
            {heroLoading ? (
              <div className="space-y-8">
                <div className="animate-pulse">
                  <div className="h-20 md:h-24 bg-white/20 rounded-lg w-4/5 mx-auto mb-8"></div>
                  <div className="h-8 md:h-10 bg-white/15 rounded-lg w-3/5 mx-auto mb-12"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                {/* Main Title with High Contrast */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 leading-tight">
                  <span className="block text-white drop-shadow-2xl">
                    {heroSection ? heroSection.title : 'Explore Seychelles'}
                  </span>
                </h1>
                
                {/* Subtitle with Better Typography */}
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                  {heroSection ? heroSection.subtitle : 'Discover trusted businesses, local services, and everything the beautiful islands of Seychelles have to offer'}
                </p>
              </div>
            )}
          </div>
          
          {/* Clean Search Bar - No shadows, borders, or backgrounds */}
          <div className="max-w-3xl mx-auto mb-16 mt-8">
            <div className="relative">
              <Suspense fallback={
                <div className="flex items-center justify-center h-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-white/70">Loading search...</span>
                  </div>
                </div>
              }>
                <SearchWithTypeahead
                  value={searchValue}
                  onChange={setSearchValue}
                  onSearch={handleSearch}
                  placeholder="What are you looking for in Seychelles?"
                />
              </Suspense>
            </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="group">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 rounded h-10 w-16 mx-auto"></div>
                  ) : (
                    `${counters.businesses}+`
                  )}
                </div>
                <p className="text-white/80 text-lg font-medium">Trusted Businesses</p>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-accent/20 rounded-full">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">15+</div>
                <p className="text-white/80 text-lg font-medium">Islands Covered</p>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-full">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 rounded h-10 w-16 mx-auto"></div>
                  ) : (
                    "New"
                  )}
                </div>
                <p className="text-white/80 text-lg font-medium">Quality Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="flex flex-col items-center space-y-2 text-white/70 hover:text-white transition-colors cursor-pointer">
          <span className="text-sm font-medium">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/40 backdrop-blur-sm rounded-full flex justify-center p-1">
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;