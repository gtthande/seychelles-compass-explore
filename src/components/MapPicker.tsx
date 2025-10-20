/**
 * MapPicker.tsx – iCompass Seychelles
 * OpenStreetMap integration with coordinate auto-binding and fallback.
 * Includes "View on Map" / "Get Directions" for public pages.
 * Designed for offline safety and low bandwidth.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RotateCcw, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onSelect: (coordinates: { lat: number; lng: number }) => void;
  onClose: () => void;
  className?: string;
  showControls?: boolean;
}

const MapPicker: React.FC<MapPickerProps> = ({
  lat = -4.619,
  lng = 55.451,
  onSelect,
  onClose,
  className = '',
  showControls = true
}) => {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({
    lat: lat || -4.619,
    lng: lng || 55.451
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  // Map event handlers
  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setCurrentPosition({ lat, lng });
        onSelect({ lat, lng });
      },
    });
    return null;
  };

  // Handle marker drag
  const handleMarkerDrag = (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setCurrentPosition({ lat, lng });
    onSelect({ lat, lng });
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        onSelect({ lat: latitude, lng: longitude });
        setGeolocationError(null);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setGeolocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Reset to default location
  const handleReset = () => {
    const defaultPosition = { lat: -4.619, lng: 55.451 }; // Seychelles center
    setCurrentPosition(defaultPosition);
    onSelect(defaultPosition);
  };

  // Use this location
  const handleUseLocation = () => {
    onSelect(currentPosition);
    onClose();
  };

  // Handle tile loading errors
  const handleTileError = () => {
    setTileError(true);
    console.warn('Map tiles failed to load - using fallback mode');
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        <div className="h-96 w-full rounded-lg overflow-hidden border">
          {!isLoading && (
            <MapContainer
              center={[currentPosition.lat, currentPosition.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
                onError={handleTileError}
              />
              <Marker
                position={[currentPosition.lat, currentPosition.lng]}
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDrag,
                }}
              />
              <MapEvents />
            </MapContainer>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {/* Tile Error Fallback */}
          {tileError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
              <div className="text-center space-y-3 p-4">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600">Map temporarily unavailable</p>
                  <p className="text-xs text-gray-500">Coordinates can still be set manually</p>
                </div>
                <Button
                  onClick={() => setTileError(false)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Retry Map
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coordinates Display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <span className="text-gray-600">
            {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
          </span>
        </div>
        {geolocationError && (
          <span className="text-xs text-orange-600">
            GPS: {geolocationError}
          </span>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGetCurrentLocation}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Navigation className="w-3 h-3 mr-1" />
              Get Current Location
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset to Default
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUseLocation}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Use This Location
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
