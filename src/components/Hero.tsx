import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, Star } from "lucide-react";
import heroImage from "@/assets/hero-seychelles.jpg";

const Hero = () => {
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
            Discover
            <span className="block bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Seychelles
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-2xl mx-auto leading-relaxed">
            Your complete directory for businesses, tourism, events, and services across the beautiful islands of Seychelles
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Search businesses, services, or locations..."
                  className="flex-1 bg-transparent border-none text-white placeholder:text-gray-200 focus:ring-0 text-lg px-6"
                />
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary-dark shadow-glow">
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-slide-up">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">500+</span>
              </div>
              <p className="text-gray-200">Local Businesses</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">25+</span>
              </div>
              <p className="text-gray-200">Island Locations</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">4.9</span>
              </div>
              <p className="text-gray-200">Average Rating</p>
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