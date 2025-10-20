/**
 * MapPickerModal.tsx – iCompass Seychelles
 * Enhanced location picker with search autocomplete and manual map selection
 */

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lon: number, address?: string) => void;
  defaultCoords?: [number, number];
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
}

export default function MapPickerModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  defaultCoords = [-4.619, 55.451] 
}: MapPickerModalProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(defaultCoords);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  // Initialize map
  useEffect(() => {
    if (!isOpen || mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView(defaultCoords, 12);
    mapRef.current = map;

    // Use CORS-safe tile layer
    L.tileLayer("https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: true,
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(defaultCoords, { draggable: true }).addTo(map);
    markerRef.current = marker;

    const updateCoords = (lat: number, lon: number) => {
      marker.setLatLng([lat, lon]);
      setCurrentCoords([lat, lon]);
      onSelect(lat, lon, currentAddress);
    };

    // Map click handler
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      updateCoords(lat, lng);
    });

    // Marker drag handler
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      updateCoords(lat, lng);
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, defaultCoords, currentAddress, onSelect]);

  // Fix map sizing when modal opens
  useEffect(() => {
    if (isOpen && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [isOpen]);

  // Search autocomplete using Nominatim
  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 3) {
      setResults([]);
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
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.warn('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lon], 14);
      markerRef.current.setLatLng([lat, lon]);
      setCurrentCoords([lat, lon]);
      setCurrentAddress(result.display_name);
      onSelect(lat, lon, result.display_name);
    }
    
    setResults([]);
    setSearch(result.display_name);
  };

  const handleConfirm = () => {
    onSelect(currentCoords[0], currentCoords[1], currentAddress);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white rounded-xl w-[90%] max-w-4xl p-6 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Pick Business Location
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for a location (e.g., Beau Vallon, Victoria, Praslin)..."
              className="pl-10 pr-4"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          {/* Search Results */}
          {results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={result.place_id || index}
                  onClick={() => handleResultClick(result)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.display_name}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="mb-4">
          <div 
            ref={mapContainerRef} 
            className="w-full h-80 rounded-lg border shadow-sm"
            style={{ background: '#f0f0f0' }}
          />
        </div>

        {/* Current Location Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Selected Location:</strong>
          </div>
          <div className="text-sm text-gray-800 mt-1">
            {currentAddress || 'No address selected'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Coordinates: {currentCoords[0].toFixed(6)}, {currentCoords[1].toFixed(6)}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 text-sm text-gray-600">
          <p>• Click anywhere on the map to set location</p>
          <p>• Drag the marker to fine-tune position</p>
          <p>• Use search to find specific addresses</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Use This Location
          </Button>
        </div>
      </div>
    </div>
  );
}
