import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeBusinessCoords } from '@/types/business';

interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  address: string;
  island: string;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  verified: boolean;
  logo_url: string;
  cover_image_url: string;
  average_rating: number;
  total_reviews: number;
  created_at: string;
}

interface GoogleMapProps {
  businesses: Business[];
  selectedBusiness?: Business | null;
  onBusinessSelect?: (business: Business) => void;
}

const GoogleMap = ({ businesses, selectedBusiness, onBusinessSelect }: GoogleMapProps) => {
  // Normalize coordinates for all businesses
  const businessesWithCoords = businesses
    .map(b => {
      const coords = normalizeBusinessCoords(b);
      return coords ? { ...b, normalizedCoords: coords } : null;
    })
    .filter((b): b is Business & { normalizedCoords: { lat: number; lng: number } } => b !== null);
  
  // Calculate center point for the map
  const getMapCenter = () => {
    if (selectedBusiness) {
      const coords = normalizeBusinessCoords(selectedBusiness);
      if (coords) {
        return coords;
      }
    }
    
    if (businessesWithCoords.length === 0) {
      return { lat: -4.6796, lng: 55.4920 }; // Seychelles center
    }
    
    // Calculate average position
    const avgLat = businessesWithCoords.reduce((sum, b) => sum + b.normalizedCoords.lat, 0) / businessesWithCoords.length;
    const avgLng = businessesWithCoords.reduce((sum, b) => sum + b.normalizedCoords.lng, 0) / businessesWithCoords.length;
    return { lat: avgLat, lng: avgLng };
  };

  const center = getMapCenter();
  
  // Generate static map URL
  const getStaticMapUrl = () => {
    if (businessesWithCoords.length === 0) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=10&size=800x400&markers=color:blue|${center.lat},${center.lng}`;
    }
    
    // Create markers for all businesses
    const markers = businessesWithCoords.map(b => 
      `markers=color:red|${b.normalizedCoords.lat},${b.normalizedCoords.lng}`
    ).join('&');
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=10&size=800x400&${markers}`;
  };

  const openInGoogleMaps = () => {
    if (selectedBusiness) {
      const coords = normalizeBusinessCoords(selectedBusiness);
      if (coords) {
        window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank');
        return;
      }
    }
    window.open(`https://www.google.com/maps?q=${center.lat},${center.lng}`, '_blank');
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-800">Business Locations</h3>
          <p className="text-sm text-blue-600">
            {businessesWithCoords.length} business{businessesWithCoords.length !== 1 ? 'es' : ''} with coordinates
          </p>
          {selectedBusiness && (
            <p className="text-xs text-blue-500 font-mono mt-2">
              {selectedBusiness.latitude.toFixed(6)}, {selectedBusiness.longitude.toFixed(6)}
            </p>
          )}
        </div>
        <Button
          onClick={openInGoogleMaps}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-blue-50"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in Google Maps
        </Button>
      </div>
    </div>
  );
};

export default GoogleMap;