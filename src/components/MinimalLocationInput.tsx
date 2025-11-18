import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { geocodeAddress } from '@/lib/minimal-geocode';
import { MapPin, X, Loader2, Navigation, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';

interface MinimalLocationInputProps {
  address: string;
  latitude: string;
  longitude: string;
  onAddressChange: (address: string) => void;
  onLatitudeChange: (latitude: string) => void;
  onLongitudeChange: (longitude: string) => void;
  disabled?: boolean;
}

const MinimalLocationInput: React.FC<MinimalLocationInputProps> = ({
  address,
  latitude,
  longitude,
  onAddressChange,
  onLatitudeChange,
  onLongitudeChange,
  disabled = false
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [coordinateInput, setCoordinateInput] = useState('');

  // Handle geocoding from address (existing functionality)
  const handleGetLocation = async () => {
    if (!address.trim()) {
      toast({
        title: 'Address Required',
        description: 'Please enter an address to get coordinates.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await geocodeAddress(address);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Update the form with new coordinates
      onAddressChange(result.formatted);
      onLatitudeChange(result.lat.toFixed(6));
      onLongitudeChange(result.lng.toFixed(6));
      
      toast({
        title: '✅ Location found',
        description: `Coordinates: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`,
      });
      
    } catch (error: any) {
      console.error('Geocoding error:', error);
      toast({
        title: '❌ Location lookup failed',
        description: error.message || 'Could not find coordinates for this address',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle getting current location using browser geolocation API
  const handleGetCurrentLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation. Please use "Pick on Map" or enter an address.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    setGeolocationLoading(true);

    // Configure geolocation options
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0 // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update form state with current location
        onLatitudeChange(latitude.toFixed(6));
        onLongitudeChange(longitude.toFixed(6));
        
        // Optionally update address if we can reverse geocode (optional enhancement)
        // For now, just update coordinates
        
        toast({
          title: '✅ Current Location Set',
          description: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
        
        setGeolocationLoading(false);
      },
      (error) => {
        setGeolocationLoading(false);
        
        let errorMessage = 'Failed to get your current location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try "Pick on Map" or enter an address.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or use "Pick on Map".';
            break;
          default:
            errorMessage = `Location error: ${error.message || 'Unknown error'}`;
            break;
        }
        
        console.error('Geolocation error:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        });
        
        toast({
          title: '❌ Location Error',
          description: errorMessage,
          variant: 'destructive',
          duration: 6000,
        });
      },
      options
    );
  };


  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="address">Address</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Street address, city"
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            disabled={!address.trim() || loading || disabled}
            className="flex items-center gap-1"
            title="Get coordinates from address (geocoding)"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            {loading ? "Locating..." : "📍 Get Location"}
          </Button>
        </div>
      </div>

      {/* Paste Coordinates Input */}
      <div className="space-y-2">
        <Label>Or Paste Coordinates Here</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={coordinateInput}
            onChange={(e) => setCoordinateInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Parse coordinates - improved regex to handle many decimal places
                // Matches: -4.614655873729187, 55.42605689637798 or -4.614655873729187,55.42605689637798
                // Also handles integers: -4, 55
                const trimmed = coordinateInput.trim();
                const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
                if (coordMatch && coordMatch[1] && coordMatch[2]) {
                  const lat = parseFloat(coordMatch[1].trim());
                  const lng = parseFloat(coordMatch[2].trim());
                  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    onLatitudeChange(lat.toFixed(6));
                    onLongitudeChange(lng.toFixed(6));
                    setCoordinateInput('');
                    toast({
                      title: '✅ Coordinates Pasted',
                      description: `Coordinates set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    });
                  } else {
                    toast({
                      title: 'Invalid Coordinates',
                      description: 'Please enter valid coordinates (e.g., -4.6515, 55.4863)',
                      variant: 'destructive',
                    });
                  }
                } else {
                  toast({
                    title: 'Could Not Parse',
                    description: 'Please paste coordinates in format: latitude, longitude (e.g., -4.6515, 55.4863)',
                    variant: 'destructive',
                  });
                }
              }
            }}
            placeholder="Paste coordinates: -4.6515, 55.4863"
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Parse coordinates - improved regex to handle many decimal places
              // Matches: -4.614655873729187, 55.42605689637798 or -4.614655873729187,55.42605689637798
              // Also handles integers: -4, 55
              const trimmed = coordinateInput.trim();
              const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
              if (coordMatch && coordMatch[1] && coordMatch[2]) {
                const lat = parseFloat(coordMatch[1].trim());
                const lng = parseFloat(coordMatch[2].trim());
                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                  onLatitudeChange(lat.toFixed(6));
                  onLongitudeChange(lng.toFixed(6));
                  setCoordinateInput('');
                  toast({
                    title: '✅ Coordinates Pasted',
                    description: `Coordinates set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                  });
                } else {
                  toast({
                    title: 'Invalid Coordinates',
                    description: 'Please enter valid coordinates (e.g., -4.6515, 55.4863)',
                    variant: 'destructive',
                  });
                }
              } else {
                toast({
                  title: 'Could Not Parse',
                  description: 'Please paste coordinates in format: latitude, longitude (e.g., -4.6515, 55.4863)',
                  variant: 'destructive',
                });
              }
            }}
            disabled={disabled || !coordinateInput.trim()}
          >
            Parse
          </Button>
        </div>
      </div>

      {/* Location Action Buttons */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={geolocationLoading || disabled}
          className="flex items-center gap-1 w-full"
          title="Use your device's GPS location"
        >
          {geolocationLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {geolocationLoading ? "Getting Location..." : "📍 Get Current Location"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            // Open Google Maps centered on Seychelles, or current coordinates if available
            const lat = latitude && !isNaN(Number(latitude)) ? Number(latitude) : -4.619;
            const lng = longitude && !isNaN(Number(longitude)) ? Number(longitude) : 55.451;
            window.open(`https://www.google.com/maps/@${lat},${lng},12z`, '_blank');
            toast({
              title: '🌍 Google Maps Opened',
              description: 'Right-click on the location → "What\'s here?" → Copy coordinates, then paste them above',
              duration: 6000,
            });
          }}
          disabled={disabled}
          className="flex items-center gap-1 w-full bg-green-50 hover:bg-green-100 border-green-200"
          title="Open Google Maps to find and copy coordinates"
        >
          <ExternalLink className="w-4 h-4" />
          🌍 Open Google Maps
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: In Google Maps, right-click → "What's here?" → Copy coordinates, then paste above
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="latitude">Latitude</Label>
            {latitude && !isNaN(Number(latitude)) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(latitude);
                    setCopiedField('lat');
                    toast({
                      title: '✅ Copied',
                      description: 'Latitude copied to clipboard',
                    });
                    setTimeout(() => setCopiedField(null), 2000);
                  } catch (err) {
                    toast({
                      title: 'Copy Failed',
                      description: 'Failed to copy latitude',
                      variant: 'destructive',
                    });
                  }
                }}
                className="h-5 px-1"
                title="Copy latitude to clipboard"
              >
                {copiedField === 'lat' ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, valid numbers, and negative numbers
              if (value === '' || (!isNaN(Number(value)) && Number(value) >= -90 && Number(value) <= 90)) {
                onLatitudeChange(value);
              }
            }}
            placeholder="-4.619143"
            className="mt-1"
            disabled={disabled}
            title="Latitude must be between -90 and 90"
          />
          {latitude && (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90) && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Must be between -90 and 90
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="longitude">Longitude</Label>
            {longitude && !isNaN(Number(longitude)) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(longitude);
                    setCopiedField('lng');
                    toast({
                      title: '✅ Copied',
                      description: 'Longitude copied to clipboard',
                    });
                    setTimeout(() => setCopiedField(null), 2000);
                  } catch (err) {
                    toast({
                      title: 'Copy Failed',
                      description: 'Failed to copy longitude',
                      variant: 'destructive',
                    });
                  }
                }}
                className="h-5 px-1"
                title="Copy longitude to clipboard"
              >
                {copiedField === 'lng' ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, valid numbers, and negative numbers
              if (value === '' || (!isNaN(Number(value)) && Number(value) >= -180 && Number(value) <= 180)) {
                onLongitudeChange(value);
              }
            }}
            placeholder="55.451315"
            className="mt-1"
            disabled={disabled}
            title="Longitude must be between -180 and 180"
          />
          {longitude && (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Must be between -180 and 180
            </p>
          )}
        </div>
      </div>
      
      {/* Show current coordinates if set with copy functionality */}
      {latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (
        <div className="p-2 bg-muted rounded-md text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Coordinates: {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                const coords = `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
                try {
                  await navigator.clipboard.writeText(coords);
                  setCopiedField('both');
                  toast({
                    title: '✅ Copied',
                    description: 'Coordinates copied to clipboard',
                  });
                  setTimeout(() => setCopiedField(null), 2000);
                } catch (err) {
                  toast({
                    title: 'Copy Failed',
                    description: 'Failed to copy coordinates',
                    variant: 'destructive',
                  });
                }
              }}
              className="h-6 px-2"
              title="Copy coordinates to clipboard"
            >
              {copiedField === 'both' ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Clear Coordinates Button */}
      {(latitude || longitude) && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onLatitudeChange('');
              onLongitudeChange('');
              toast({
                title: 'Coordinates Cleared',
                description: 'You can now search for the correct location.',
              });
            }}
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear Coordinates
          </Button>
        </div>
      )}

    </div>
  );
};

export default MinimalLocationInput;
