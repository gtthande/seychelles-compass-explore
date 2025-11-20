import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, X, Loader2, Navigation, AlertCircle, ExternalLink } from 'lucide-react';

export type CoordinateSource = 'none' | 'current-location' | 'manual';

interface MinimalLocationInputProps {
  address: string;
  latitude: string;
  longitude: string;
  onAddressChange: (address: string) => void;
  onLatitudeChange: (latitude: string) => void;
  onLongitudeChange: (longitude: string) => void;
  onIslandChange?: (island: string) => void;
  onCoordinateSourceChange?: (source: CoordinateSource) => void;
  disabled?: boolean;
}

/**
 * MinimalLocationInput - Single source of truth for business coordinates
 * 
 * Features:
 * - Single pair of latitude/longitude fields (the canonical values)
 * - Browser geolocation (optional - fills coordinates from device GPS)
 * - Paste coordinates (optional - fills coordinates from pasted text)
 * - Manual coordinate entry (always available)
 * - Open Google Maps (opens maps with coordinates or address)
 * 
 * Rules:
 * - Only ONE pair of coordinates exists: { latitude, longitude }
 * - All methods (GPS, paste, manual) update the SAME fields
 * - No duplicate coordinate displays
 * - No external geocoding API calls (no API key required)
 * - Coordinates are preserved when editing existing businesses
 */
const MinimalLocationInput: React.FC<MinimalLocationInputProps> = ({
  address,
  latitude,
  longitude,
  onAddressChange,
  onLatitudeChange,
  onLongitudeChange,
  onIslandChange,
  onCoordinateSourceChange,
  disabled = false
}) => {
  const { toast } = useToast();
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource>('none');

  // Initialize coordinate source based on existing values (only on mount)
  useEffect(() => {
    const hasCoords = latitude && longitude && 
                     !isNaN(Number(latitude)) && 
                     !isNaN(Number(longitude));
    if (hasCoords && coordinateSource === 'none') {
      // If editing existing business with coordinates, treat as manual
      // This preserves the coordinates and doesn't auto-overwrite them
      setCoordinateSource('manual');
      onCoordinateSourceChange?.('manual');
    } else if (!hasCoords && coordinateSource !== 'none') {
      setCoordinateSource('none');
      onCoordinateSourceChange?.('none');
    }
  }, []); // Only run on mount - don't re-run when coordinates change externally

  // Update coordinate source when coordinates are cleared
  const updateCoordinateSource = (source: CoordinateSource) => {
    setCoordinateSource(source);
    onCoordinateSourceChange?.(source);
  };

  /**
   * Handle getting current location using browser geolocation API ONLY
   * No external geocoding API calls - just browser GPS
   */
  const handleGetCurrentLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation. Please paste coordinates manually.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    setGeolocationLoading(true);

    // Configure geolocation options
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds timeout
      maximumAge: 0 // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: deviceLat, longitude: deviceLng } = position.coords;
        
        console.log("[Location] Geolocation result:", position);
        
        // Update the SAME latitude/longitude fields (single source of truth)
        onLatitudeChange(deviceLat.toFixed(6));
        onLongitudeChange(deviceLng.toFixed(6));
        updateCoordinateSource('current-location');
        
        toast({
          title: '✅ Current Location Set',
          description: `Business coordinates set to your current location: ${deviceLat.toFixed(6)}, ${deviceLng.toFixed(6)}`,
        });
        
        setGeolocationLoading(false);
      },
      (error) => {
        setGeolocationLoading(false);
        
        // Special handling for PERMISSION_DENIED - don't treat as fatal error
        if (error.code === error.PERMISSION_DENIED) {
          console.log("[Location] Permission denied by user");
          toast({
            title: 'Location Permission Denied',
            description: 'Location access denied. Enable permissions and try again.',
            variant: 'default',
            duration: 5000,
          });
          // Do NOT change existing coordinates on permission denial
          return;
        }
        
        let errorMessage = 'Location lookup failed: ';
        
        switch (error.code) {
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please paste coordinates manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or paste coordinates manually.';
            break;
          default:
            errorMessage += `Geolocation request denied.`;
            break;
        }
        
        console.warn('[Location] Geolocation error:', {
          code: error.code,
          message: error.message,
        });
        
        toast({
          title: '⚠️ Location Error',
          description: errorMessage,
          variant: 'default', // Not destructive - form still works
          duration: 6000,
        });
        // Do NOT change existing coordinates on error
      },
      options
    );
  };

  /**
   * Build Google Maps URL using coordinates or address
   * Priority: coordinates > address > default
   */
  const buildMapsUrl = (): string => {
    const latNum = latitude ? Number(latitude) : null;
    const lngNum = longitude ? Number(longitude) : null;
    
    // If we have valid coordinates, use them with the new API format
    if (latNum !== null && lngNum !== null && 
        !isNaN(latNum) && !isNaN(lngNum) &&
        latNum >= -90 && latNum <= 90 &&
        lngNum >= -180 && lngNum <= 180) {
      return `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
    }
    
    // Else if we have an address, use it
    if (address && address.trim().length > 0) {
      const encoded = encodeURIComponent(address.trim());
      return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    }
    
    // Default: just open Google Maps
    return "https://www.google.com/maps";
  };

  /**
   * Handle opening Google Maps
   * Just opens a new tab - no auto-parsing
   */
  const handleOpenMaps = () => {
    const url = buildMapsUrl();
    window.open(url, "_blank", "noopener,noreferrer");
  };


  /**
   * Handle clear coordinates - clears the SAME latitude/longitude fields
   */
  const handleClearCoordinates = () => {
    console.log("[Location] Cleared.");
    onLatitudeChange('');
    onLongitudeChange('');
    updateCoordinateSource('none');
    // Clear island when coordinates are cleared
    if (onIslandChange) {
      onIslandChange('');
    }
    toast({
      title: 'Coordinates Cleared',
      description: 'You can now search for the correct location.',
    });
  };

  // Check if we have valid coordinates (for UI conditional rendering)
  const hasValidCoordinates = latitude && longitude && 
                             !isNaN(Number(latitude)) && 
                             !isNaN(Number(longitude)) &&
                             Number(latitude) >= -90 && Number(latitude) <= 90 &&
                             Number(longitude) >= -180 && Number(longitude) <= 180;

  return (
    <div className="space-y-3">
      {/* A) Address Input */}
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Street address, city (e.g., Berjaya Hotel, Beau Vallon)"
          className="mt-1"
          disabled={disabled}
        />
      </div>

      {/* B) Open Google Maps Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpenMaps}
        disabled={disabled}
        className="flex items-center gap-1 w-full bg-green-50 hover:bg-green-100 border-green-200"
        title="Open Google Maps to find coordinates"
      >
        <ExternalLink className="w-4 h-4" />
        🌍 Open Google Maps
      </Button>

      {/* Get Current Location Button - Always visible */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGetCurrentLocation}
        disabled={geolocationLoading || disabled}
        className="flex items-center gap-1 w-full"
        title="Use your device's GPS location for the business"
      >
        {geolocationLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        {geolocationLoading ? "Getting Location..." : "📍 Get Location"}
      </Button>

      {/* D) Single pair of Latitude/Longitude fields - Always visible (THE CANONICAL VALUES) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
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
                if (value && longitude) {
                  updateCoordinateSource('manual');
                }
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
          <Label htmlFor="longitude">Longitude</Label>
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
                if (value && latitude) {
                  updateCoordinateSource('manual');
                }
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

      {/* E) Clear Coordinates Button - Only show when coordinates are set */}
      {hasValidCoordinates && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearCoordinates}
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
