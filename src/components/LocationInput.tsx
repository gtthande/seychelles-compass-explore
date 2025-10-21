/**
 * LocationInput.tsx – iCompass Seychelles
 * Parses Google Maps links or raw coordinates into lat/lon
 * API-free location input component
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LocationInputProps {
  onParsed: (lat: number, lon: number, link: string) => void;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ onParsed, className = '' }) => {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const parseLocation = async () => {
    if (!input.trim()) {
      toast.error('Please enter a Google Maps link or coordinates');
      return;
    }

    setIsParsing(true);
    toast.loading('Parsing location...', { id: 'parse' });

    try {
      let lat: number, lon: number;
      let parsedLink = input.trim();

      // Pattern 1: Raw coordinates (lat, lon or lat lon)
      const coordMatch = input.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lon = parseFloat(coordMatch[2]);
        
        // Validate coordinate ranges (Seychelles approximate bounds)
        if (lat < -10 || lat > -4 || lon < 55 || lon > 56) {
          toast.error('Coordinates appear to be outside Seychelles. Please verify.', { id: 'parse' });
          return;
        }
        
        toast.success('Coordinates parsed successfully!', { id: 'parse' });
        setCoords({ lat, lon });
        onParsed(lat, lon, parsedLink);
        return;
      }

      // Pattern 2: Google Maps URL with @ coordinates
      const urlMatch = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (urlMatch) {
        lat = parseFloat(urlMatch[1]);
        lon = parseFloat(urlMatch[2]);
        
        toast.success('Google Maps link parsed successfully!', { id: 'parse' });
        setCoords({ lat, lon });
        onParsed(lat, lon, parsedLink);
        return;
      }

      // Pattern 3: Google Maps URL with query parameters
      const queryMatch = input.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (queryMatch) {
        lat = parseFloat(queryMatch[1]);
        lon = parseFloat(queryMatch[2]);
        
        toast.success('Google Maps query parsed successfully!', { id: 'parse' });
        setCoords({ lat, lon });
        onParsed(lat, lon, parsedLink);
        return;
      }

      // Pattern 4: Google Maps short URL (goo.gl, maps.app.goo.gl)
      if (input.includes('goo.gl') || input.includes('maps.app.goo.gl')) {
        toast.error('Short URLs cannot be parsed automatically. Please use the full Google Maps URL or paste coordinates directly.', { id: 'parse' });
        return;
      }

      // No pattern matched
      toast.error('Could not parse coordinates. Please paste a Google Maps link or raw coordinates (e.g., -4.6515, 55.4863)', { id: 'parse' });
      
    } catch (error) {
      console.error('Location parsing error:', error);
      toast.error('Error parsing location. Please try again.', { id: 'parse' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      parseLocation();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Sanitize: Remove any internal route patterns that might cause router issues
    // This prevents accidentally pasted internal links from interfering with React Router
    value = value.replace(/^https?:\/\/localhost.*\/businesses\//, '');
    value = value.replace(/^https?:\/\/.*\/admin\/businesses\//, '');
    
    setInput(value);
  };

  const openMaps = () => {
    if (coords) {
      window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lon}`, '_blank');
    }
  };

  const openDirections = () => {
    if (coords) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`, '_blank');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 inline mr-1" />
          Paste Google Maps Link or Coordinates
        </label>
        
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="https://maps.google.com/... or -4.6515, 55.4863"
            className="flex-1"
            disabled={isParsing}
          />
          <Button 
            onClick={parseLocation} 
            disabled={isParsing || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isParsing ? 'Parsing...' : 'Parse'}
          </Button>
        </div>
      </div>

      {/* Action Buttons - Show when coordinates are parsed */}
      {coords && (
        <div className="flex gap-2 mt-3 transition-opacity duration-300 ease-in-out opacity-100">
          <Button
            onClick={openMaps}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View in Maps
          </Button>
          <Button
            onClick={openDirections}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Navigation className="w-3 h-3 mr-1" />
            Get Directions
          </Button>
          <div className="flex items-center text-sm text-gray-600 ml-2">
            <MapPin className="w-3 h-3 mr-1" />
            <span>Coordinates: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default LocationInput;
