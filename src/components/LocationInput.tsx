/**
 * LocationInput.tsx – iCompass Seychelles
 * Parses Google Maps links or raw coordinates into lat/lon
 * API-free location input component
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationInputProps {
  onParsed: (lat: number, lon: number, link: string) => void;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ onParsed, className = '' }) => {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const parseLocation = async () => {
    if (!input.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter a Google Maps link or coordinates',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);

    try {
      let lat: number, lon: number;
      let parsedLink = input.trim();

      // Pattern 1: Raw coordinates (lat, lon or lat lon)
      // Match: -4.6515, 55.4863 or -4.6515 55.4863
      const coordMatch = input.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
      if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lon = parseFloat(coordMatch[2]);
        
        // Validate coordinate ranges
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          toast({
            title: 'Invalid Coordinates',
            description: 'Coordinates must be valid: latitude between -90 and 90, longitude between -180 and 180.',
            variant: 'destructive',
          });
          setIsParsing(false);
          return;
        }
        
        toast({
          title: '✅ Coordinates Parsed',
          description: 'Coordinates parsed successfully!',
        });
        onParsed(lat, lon, parsedLink);
        setIsParsing(false);
        setInput(''); // Clear input after successful parse
        return;
      }

      // Pattern 2: Google Maps URL with @ coordinates
      const urlMatch = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (urlMatch) {
        lat = parseFloat(urlMatch[1]);
        lon = parseFloat(urlMatch[2]);
        
        toast({
          title: '✅ Google Maps Link Parsed',
          description: 'Google Maps link parsed successfully!',
        });
        onParsed(lat, lon, parsedLink);
        setIsParsing(false);
        setInput(''); // Clear input after successful parse
        return;
      }

      // Pattern 3: Google Maps URL with query parameters
      const queryMatch = input.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (queryMatch) {
        lat = parseFloat(queryMatch[1]);
        lon = parseFloat(queryMatch[2]);
        
        toast({
          title: '✅ Google Maps Link Parsed',
          description: 'Google Maps query parsed successfully!',
        });
        onParsed(lat, lon, parsedLink);
        setIsParsing(false);
        setInput(''); // Clear input after successful parse
        return;
      }

      // Pattern 4: Google Maps short URL (goo.gl, maps.app.goo.gl)
      if (input.includes('goo.gl') || input.includes('maps.app.goo.gl')) {
        toast({
          title: 'Short URL Not Supported',
          description: 'Short URLs cannot be parsed automatically. Please use the full Google Maps URL or paste coordinates directly.',
          variant: 'destructive',
        });
        setIsParsing(false);
        return;
      }

      // No pattern matched
      toast({
        title: 'Could Not Parse',
        description: 'Could not parse coordinates. Please paste a Google Maps link or raw coordinates (e.g., -4.6515, 55.4863)',
        variant: 'destructive',
      });
      setIsParsing(false);
      
    } catch (error) {
      console.error('Location parsing error:', error);
      toast({
        title: 'Parsing Error',
        description: 'Error parsing location. Please try again.',
        variant: 'destructive',
      });
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

  const openGoogleMaps = () => {
    window.open('https://www.google.com/maps/@-4.619,55.451,12z', '_blank');
  };

  const openHowToGuide = () => {
    window.open('https://support.google.com/maps/answer/18539?hl=en', '_blank');
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

      {/* Helper Buttons - Open Google Maps to find coordinates */}
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          onClick={openGoogleMaps}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          🌍 Open Google Maps
        </Button>
        <Button
          onClick={openHowToGuide}
          size="sm"
          variant="outline"
          className="bg-gray-200 hover:bg-gray-300"
        >
          ℹ️ How to Get My Coordinates
        </Button>
      </div>

    </div>
  );
};

export default LocationInput;
