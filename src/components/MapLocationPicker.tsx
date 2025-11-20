import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/loadGoogleMaps';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RotateCcw } from 'lucide-react';

interface MapLocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onSelect: (coordinates: { lat: number; lng: number }) => void;
  onClose: () => void;
  className?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  lat = -4.619,
  lng = 55.451,
  onSelect,
  onClose,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({
    lat: lat || -4.619,
    lng: lng || 55.451
  });

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        
        // Load Google Maps API
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error("Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.");
        }
        const maps = await loadGoogleMaps(apiKey);
        mapInstanceRef.current = maps;

        // Set initial center
        const center = {
          lat: currentPosition.lat,
          lng: currentPosition.lng
        };

        // Create map
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 15,
          mapTypeId: maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: true,
          zoomControl: true,
          clickableIcons: false
        });

        // Create draggable marker
        const marker = new maps.Marker({
          position: center,
          map,
          draggable: true,
          title: 'Business Location',
          animation: maps.Animation.DROP
        });

        markerRef.current = marker;

        // Add drag event listener
        maps.event.addListener(marker, 'dragend', () => {
          const position = marker.getPosition();
          const newPosition = {
            lat: position.lat(),
            lng: position.lng()
          };
          setCurrentPosition(newPosition);
          onSelect(newPosition);
        });

        // Add click event listener to map
        maps.event.addListener(map, 'click', (event: any) => {
          const newPosition = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          marker.setPosition(event.latLng);
          setCurrentPosition(newPosition);
          onSelect(newPosition);
        });

        setIsLoading(false);

      } catch (error: any) {
        console.error('Error initializing map:', error);
        toast({
          title: 'Map Loading Error',
          description: error.message || 'Failed to load the map. Please try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        if (mapInstanceRef.current && markerRef.current) {
          const maps = mapInstanceRef.current;
          const latLng = new maps.LatLng(newPosition.lat, newPosition.lng);
          markerRef.current.setPosition(latLng);
          mapInstanceRef.current.Map.prototype.setCenter.call(markerRef.current.map, latLng);
        }
        
        setCurrentPosition(newPosition);
        onSelect(newPosition);
        
        toast({
          title: 'Location Found',
          description: 'Your current location has been set on the map.'
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        toast({
          title: 'Location Error',
          description: errorMessage,
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleResetToDefault = () => {
    const defaultPosition = { lat: -4.619, lng: 55.451 }; // Seychelles center
    
    if (mapInstanceRef.current && markerRef.current) {
      const maps = mapInstanceRef.current;
      const latLng = new maps.LatLng(defaultPosition.lat, defaultPosition.lng);
      markerRef.current.setPosition(latLng);
      mapInstanceRef.current.Map.prototype.setCenter.call(markerRef.current.map, latLng);
    }
    
    setCurrentPosition(defaultPosition);
    onSelect(defaultPosition);
    
    toast({
      title: 'Location Reset',
      description: 'Reset to default Seychelles location.'
    });
  };

  const handleUseLocation = () => {
    onSelect(currentPosition);
    onClose();
    
    toast({
      title: 'Location Selected',
      description: `Coordinates: ${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-lg border border-gray-200"
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            className="flex items-center gap-1"
          >
            <Navigation className="w-4 h-4" />
            Get Current Location
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <MapPin className="w-4 h-4 inline mr-1" />
          {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">How to use:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Drag the red marker to your business location</li>
          <li>Click anywhere on the map to move the marker</li>
          <li>Use "Get Current Location" to use your GPS</li>
          <li>Click "Use This Location" when satisfied</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleUseLocation}
          className="flex items-center gap-1"
        >
          <MapPin className="w-4 h-4" />
          Use This Location
        </Button>
      </div>
    </div>
  );
};

export default MapLocationPicker;















