/**
 * MapPicker.tsx – iCompass Seychelles
 * Full offline-safe OpenStreetMap picker with
 * autocomplete search, coordinate binding, and public directions.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, RotateCcw, AlertCircle, Search, Wifi, WifiOff } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SearchResult {
  place_id: string;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
}

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onSelect: (coordinates: { lat: number; lng: number }) => void;
  onClose: () => void;
  className?: string;
  showControls?: boolean;
  isOpen?: boolean; // Modal open state for map sizing
}

const MapPicker: React.FC<MapPickerProps> = ({
  lat = -4.619,
  lng = 55.451,
  onSelect,
  onClose,
  className = '',
  showControls = true,
  isOpen = true
}) => {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({
    lat: lat || -4.619,
    lng: lng || 55.451
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, SearchResult[]>>(new Map());
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !isOnline) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Check cache first
    if (searchCache.has(query.toLowerCase())) {
      setSearchResults(searchCache.get(query.toLowerCase())!);
      setShowSearchResults(true);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'iCompass-Seychelles/1.0'
          }
        }
      );
      
      if (response.ok) {
        const results: SearchResult[] = await response.json();
        setSearchResults(results);
        setShowSearchResults(true);
        
        // Cache results (keep last 10 queries)
        const newCache = new Map(searchCache);
        newCache.set(query.toLowerCase(), results);
        if (newCache.size > 10) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        setSearchCache(newCache);
      }
    } catch (error) {
      console.warn('Search failed:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [isOnline, searchCache]);

  // Handle search input with debouncing
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Handle search result selection
  const handleSearchSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setCurrentPosition({ lat, lng });
    onSelect({ lat, lng });
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
  };

  // Map event handlers
  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setCurrentPosition({ lat, lng });
        onSelect({ lat, lng });
        setShowSearchResults(false);
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
    setSearchQuery('');
    setShowSearchResults(false);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Fix map sizing when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal animation is complete
      const timer = setTimeout(() => {
        // Trigger map resize by dispatching a window resize event
        window.dispatchEvent(new Event('resize'));
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={handleSearchInput}
            className="w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isOnline && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSearchSelect(result)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm text-gray-900">{result.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{result.display_name}</div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-sm text-gray-500">
                No results found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div className="h-96 w-full rounded-lg overflow-hidden border">
          {!isLoading && (
            <MapContainer
              key={isOpen ? 'open' : 'closed'}
              center={[currentPosition.lat, currentPosition.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

      {/* Location Display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <span className="text-gray-600">
            📍 Location: {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
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
