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
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  canEdit?: boolean;
}

const BusinessLocationMap = ({ 
  business, 
  height = "200px", 
  showTitle = true,
  onLocationUpdate,
  canEdit = false
}: BusinessLocationMapProps) => {
  const openInMaps = () => {
    if (business.latitude && business.longitude) {
      const url = `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Don't render anything if we don't have location data
  if (!business.latitude || !business.longitude || !business.address) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {showTitle && (
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Location</h3>
          </div>
        )}
        
        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground break-words">
                {business.address}
                {business.island && (
                  <span className="text-muted-foreground"> • {business.island}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {business.latitude.toFixed(6)}, {business.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={openInMaps}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Google Maps
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessLocationMap;