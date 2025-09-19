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
  
  // Alternative: Use a static map image as fallback
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${business.longitude},${business.latitude})/${business.longitude},${business.latitude},15,0/300x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;

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
          {/* Simple map placeholder with click to open */}
          <div 
            className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer transition-all duration-200 hover:opacity-90 rounded-lg overflow-hidden"
            onClick={openInMaps}
          >
            <div className="text-center p-4">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-800 mb-2">View Location</h3>
              <p className="text-sm text-blue-600 mb-3">
                {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  openInMaps();
                }}
              >
                Open in Maps
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