import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin, Navigation } from 'lucide-react';
import { getDirectionsUrl, getViewUrl, getEmbedUrl, isValidCoordinates, formatCoordinates } from '@/lib/maps';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  lat: number;
  lng: number;
  address?: string;
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  businessName,
  lat,
  lng,
  address
}) => {
  const handleGetDirections = () => {
    const url = getDirectionsUrl(lat, lng);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewInGoogleMaps = () => {
    const url = getViewUrl(lat, lng);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get API key from environment
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Create Google Maps embed URL using utility function
  const embedUrl = apiKey ? getEmbedUrl(lat, lng, apiKey) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {businessName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {address && (
            <p className="text-sm text-muted-foreground mt-1">{address}</p>
          )}
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* Map Container */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden border">
            {apiKey && embedUrl ? (
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map of ${businessName}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Google Maps API key not configured
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Location: {formatCoordinates(lat, lng)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleGetDirections}
              className="flex-1"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            <Button
              onClick={handleViewInGoogleMaps}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <MapPin className="w-4 h-4 mr-2" />
              View in Google Maps
            </Button>
          </div>

          {/* Location Details */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Coordinates: {formatCoordinates(lat, lng)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapModal;
