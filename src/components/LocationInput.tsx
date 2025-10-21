/**
 * LocationInput.tsx – iCompass Seychelles
 * Parses Google Maps links or raw coordinates into lat/lon
 * API-free location input component
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LocationInputProps {
  onParsed: (lat: number, lon: number, link: string) => void;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ onParsed, className = '' }) => {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

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
        onParsed(lat, lon, parsedLink);
        return;
      }

      // Pattern 2: Google Maps URL with @ coordinates
      const urlMatch = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (urlMatch) {
        lat = parseFloat(urlMatch[1]);
        lon = parseFloat(urlMatch[2]);
        
        toast.success('Google Maps link parsed successfully!', { id: 'parse' });
        onParsed(lat, lon, parsedLink);
        return;
      }

      // Pattern 3: Google Maps URL with query parameters
      const queryMatch = input.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (queryMatch) {
        lat = parseFloat(queryMatch[1]);
        lon = parseFloat(queryMatch[2]);
        
        toast.success('Google Maps query parsed successfully!', { id: 'parse' });
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
            onChange={(e) => setInput(e.target.value)}
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

      {/* Help text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">How to get coordinates:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Open Google Maps and find your location</li>
              <li>Right-click on the exact spot → "What's here?"</li>
              <li>Copy the coordinates that appear</li>
              <li>Or copy the full Google Maps URL</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationInput;
