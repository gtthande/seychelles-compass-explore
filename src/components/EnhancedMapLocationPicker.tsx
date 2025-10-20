import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/loadGoogleMaps';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RotateCcw, AlertCircle } from 'lucide-react';

interface EnhancedMapLocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onSelect: (coordinates: { lat: number; lng: number }) => void;
  onClose: () => void;
  className?: string;
}

const EnhancedMapLocationPicker: React.FC<EnhancedMapLocationPickerProps> = ({
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
  const [mapType, setMapType] = useState<'google' | 'leaflet' | 'error'>('google');
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({
    lat: lat || -4.619,
    lng: lng || 55.451
  });

  // Initialize map with Google Maps or Leaflet fallback
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        
        // Try Google Maps first
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (apiKey && apiKey !== 'your_key_here') {
          try {
            const maps = await loadGoogleMaps(apiKey);
            await initGoogleMap(maps);
            setMapType('google');
            return;
          } catch (error) {
            console.warn('Google Maps failed, falling back to Leaflet:', error);
          }
        }
        
        // Fallback to Leaflet
        await initLeafletMap();
        setMapType('leaflet');
        
      } catch (error) {
        console.error('Both Google Maps and Leaflet failed:', error);
        setMapType('error');
        toast({
          title: "Map Loading Error",
          description: "Unable to load map. Please check your internet connection.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  const initGoogleMap = async (maps: any) => {
    if (!mapRef.current) return;

    const center = {
      lat: currentPosition.lat,
      lng: currentPosition.lng
    };

    // Create Google Map
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
    mapInstanceRef.current = map;

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
  };

  const initLeafletMap = async () => {
    if (!mapRef.current) return;

    // Dynamically import Leaflet
    const L = await import('leaflet');
    const { MapContainer, TileLayer, Marker, useMapEvents } = await import('react-leaflet');

    // Fix Leaflet default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const center: [number, number] = [currentPosition.lat, currentPosition.lng];

    // Create Leaflet map
    const map = L.map(mapRef.current).setView(center, 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create draggable marker
    const marker = L.marker(center, { draggable: true }).addTo(map);
    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Add drag event listener
    marker.on('dragend', (event: any) => {
      const position = event.target.getLatLng();
      const newPosition = {
        lat: position.lat,
        lng: position.lng
      };
      setCurrentPosition(newPosition);
      onSelect(newPosition);
    });

    // Add click event listener to map
    map.on('click', (event: any) => {
      const newPosition = {
        lat: event.latlng.lat,
        lng: event.latlng.lng
      };
      marker.setLatLng([newPosition.lat, newPosition.lng]);
      setCurrentPosition(newPosition);
      onSelect(newPosition);
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentPosition(newPosition);
        onSelect(newPosition);
        
        // Update map marker
        if (mapType === 'google' && markerRef.current && mapInstanceRef.current) {
          const maps = (window as any).google?.maps;
          if (maps) {
            const latLng = new maps.LatLng(newPosition.lat, newPosition.lng);
            markerRef.current.setPosition(latLng);
            mapInstanceRef.current.setCenter(latLng);
          }
        } else if (mapType === 'leaflet' && markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([newPosition.lat, newPosition.lng]);
          mapInstanceRef.current.setView([newPosition.lat, newPosition.lng], 15);
        }
        
        toast({
          title: "Location Updated",
          description: `Current location: ${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to get your current location. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  const handleResetToDefault = () => {
    const defaultPosition = { lat: -4.619, lng: 55.451 }; // Victoria, Seychelles
    setCurrentPosition(defaultPosition);
    onSelect(defaultPosition);
    
    // Update map marker
    if (mapType === 'google' && markerRef.current && mapInstanceRef.current) {
      const maps = (window as any).google?.maps;
      if (maps) {
        const latLng = new maps.LatLng(defaultPosition.lat, defaultPosition.lng);
        markerRef.current.setPosition(latLng);
        mapInstanceRef.current.setCenter(latLng);
      }
    } else if (mapType === 'leaflet' && markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([defaultPosition.lat, defaultPosition.lng]);
      mapInstanceRef.current.setView([defaultPosition.lat, defaultPosition.lng], 15);
    }
  };

  const handleUseLocation = () => {
    onSelect(currentPosition);
    onClose();
    toast({
      title: "Location Selected",
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

        {mapType === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center space-y-2">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-sm text-gray-600">Unable to load map</p>
              <p className="text-xs text-gray-500">Please check your internet connection</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Type Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">
            {mapType === 'google' ? 'Google Maps' : mapType === 'leaflet' ? 'OpenStreetMap' : 'Map Unavailable'}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
        </div>
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

        <div className="flex gap-2">
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
            disabled={mapType === 'error'}
          >
            Use This Location
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">How to use:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click anywhere on the map to set the location</li>
          <li>Drag the marker to fine-tune the position</li>
          <li>Use "Get Current Location" to use your GPS location</li>
          <li>Click "Use This Location" to confirm your selection</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedMapLocationPicker;
