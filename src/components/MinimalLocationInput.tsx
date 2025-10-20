import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { geocodeAddress } from '@/lib/minimal-geocode';
import EnhancedMapLocationPicker from '@/components/EnhancedMapLocationPicker';
import { MapPin, Map, X } from 'lucide-react';

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
  const [showMap, setShowMap] = useState(false);

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

  const handleMapSelect = (coordinates: { lat: number; lng: number }) => {
    onLatitudeChange(coordinates.lat.toFixed(6));
    onLongitudeChange(coordinates.lng.toFixed(6));
    setShowMap(false);
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
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            {loading ? "Locating..." : "📍 Get Location"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMap(true)}
            disabled={disabled}
            className="flex items-center gap-1"
          >
            <Map className="w-4 h-4" />
            🗺️ Pick on Map
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            value={latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            placeholder="Latitude"
            className="mt-1"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            value={longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            placeholder="Longitude"
            className="mt-1"
            disabled={disabled}
          />
        </div>
      </div>

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

      {/* Map Picker Dialog */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Pick Business Location on Map
            </DialogTitle>
          </DialogHeader>
          <EnhancedMapLocationPicker
            lat={latitude ? parseFloat(latitude) : null}
            lng={longitude ? parseFloat(longitude) : null}
            onSelect={handleMapSelect}
            onClose={() => setShowMap(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinimalLocationInput;
