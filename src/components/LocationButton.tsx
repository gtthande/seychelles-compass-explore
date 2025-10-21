/**
 * LocationButton.tsx – iCompass Seychelles
 * Optional standalone location picker button component
 * Provides quick access to location selection functionality
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LocationButtonProps {
  onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
  currentLocation?: { lat: number; lng: number };
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const LocationButton: React.FC<LocationButtonProps> = ({
  onLocationSelect,
  currentLocation,
  className = '',
  variant = 'outline',
  size = 'sm'
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    toast.loading('Getting your location...', { id: 'location' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect({ lat: latitude, lng: longitude });
        toast.success('Current location set!', { id: 'location' });
        setIsGettingLocation(false);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        toast.error('Unable to access GPS location', { id: 'location' });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleOpenInGoogleMaps = () => {
    if (!currentLocation) {
      toast.error('No location selected');
      return;
    }

    const { lat, lng } = currentLocation;
    toast('Opening Google Maps — copy the coordinates and paste them back here.', {
      duration: 4000,
      icon: '🗺️'
    });
    
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleGetCurrentLocation}
        variant={variant}
        size={size}
        disabled={isGettingLocation}
        className="flex items-center gap-2"
      >
        <Navigation className="w-4 h-4" />
        {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
      </Button>
      
      {currentLocation && (
        <Button
          onClick={handleOpenInGoogleMaps}
          variant="outline"
          size={size}
          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
        >
          <ExternalLink className="w-4 h-4" />
          Open in Google Maps
        </Button>
      )}
      
      {currentLocation && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
};

export default LocationButton;
