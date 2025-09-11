import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Business {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  island?: string;
}

interface BusinessLocationMapProps {
  business: Business;
  height?: string;
  showTitle?: boolean;
}

const BusinessLocationMap = ({ 
  business, 
  height = "200px", 
  showTitle = true 
}: BusinessLocationMapProps) => {
  // Don't render anything if we don't have location data
  if (!business.latitude || !business.longitude || !business.address) {
    return null;
  }

  const openInMaps = () => {
    const coords = `${business.latitude},${business.longitude}`;
    const query = encodeURIComponent(business.name + ', ' + business.address);
    
    // Detect device type for optimal maps experience
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (isIOS) {
        // Use Apple Maps on iOS
        window.open(`http://maps.apple.com/?q=${query}&ll=${coords}`);
      } else {
        // Use Google Maps on Android
        window.open(`https://maps.google.com/?q=${coords}(${query})`);
      }
    } else {
      // Desktop - use Google Maps
      window.open(`https://maps.google.com/?q=${coords}(${query})`);
    }
  };

  // Create OpenStreetMap tile URL for lightweight map display
  const osmTileUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${business.longitude-0.01},${business.latitude-0.01},${business.longitude+0.01},${business.latitude+0.01}&layer=mapnik&marker=${business.latitude},${business.longitude}`;

  return (
    <Card className="overflow-hidden">
      {showTitle && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Location</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openInMaps}
              className="h-auto p-1"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="relative" style={{ height }}>
          {/* Lightweight embedded map using OpenStreetMap */}
          <div 
            className="w-full h-full bg-muted flex items-center justify-center cursor-pointer transition-all duration-200 hover:opacity-90 rounded-lg overflow-hidden"
            onClick={openInMaps}
          >
            <iframe
              src={osmTileUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map showing location of ${business.name}`}
              onError={(e) => {
                // Fallback to a simple location indicator
                const target = e.currentTarget;
                const nextElement = target.nextElementSibling as HTMLElement;
                target.style.display = 'none';
                if (nextElement) {
                  nextElement.style.display = 'flex';
                }
              }}
            />
            <div 
              className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center flex-col hidden absolute inset-0"
            >
              <MapPin className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm text-muted-foreground text-center px-4">
                Click to view location
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={openInMaps}
              >
                View Location
              </Button>
            </div>
          </div>
        </div>
        
        {business.address && (
          <div className="p-3 bg-background">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground break-words">
                  {business.address}
                  {business.island && (
                    <span className="text-muted-foreground"> • {business.island}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessLocationMap;