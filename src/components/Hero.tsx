import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, Star } from "lucide-react";
import { useLiveCounters } from "@/hooks/useLiveCounters";
import SearchWithTypeahead from "@/components/SearchWithTypeahead";
import heroImage from "@/assets/hero-seychelles.jpg";
import { useState } from "react";

const Hero = () => {
  const { counters, loading } = useLiveCounters();
  const [searchValue, setSearchValue] = useState("");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Explore
            <span className="block bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Seychelles
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-2xl mx-auto leading-relaxed">
            Find trusted businesses, discover local services, and explore everything Seychelles has to offer
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
              <SearchWithTypeahead
                value={searchValue}
                onChange={setSearchValue}
                placeholder="What are you looking for today?"
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-slide-up">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto" />
                  ) : (
                    `${counters.businesses}+`
                  )}
                </span>
              </div>
              <p className="text-gray-200">Trusted Businesses</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">15+</span>
              </div>
              <p className="text-gray-200">Islands Covered</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto" />
                  ) : counters.reviews > 0 ? (
                    "4.8"
                  ) : (
                    "New"
                  )}
                </span>
              </div>
              <p className="text-gray-200">Quality Rating</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Animation */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;