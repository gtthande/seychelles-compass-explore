import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink, Loader2, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoogleMapsApiKey } from '@/hooks/useGoogleMapsApiKey';

interface Business {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  island?: string;
}

interface BusinessLocationMapProps {
  business: Business;
  height?: string;
  showTitle?: boolean;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  canEdit?: boolean;
}

const BusinessLocationMap = ({ 
  business, 
  height = "200px", 
  showTitle = true,
  onLocationUpdate,
  canEdit = false
}: BusinessLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [manualApiKey, setManualApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const { apiKey, loading: apiKeyLoading, error: apiKeyError } = useGoogleMapsApiKey();

  // Initialize edit values when business changes
  useEffect(() => {
    if (business.latitude && business.longitude) {
      setEditLatitude(business.latitude.toString());
      setEditLongitude(business.longitude.toString());
    }
  }, [business.latitude, business.longitude]);

  // Don't render anything if we don't have location data
  if (!business.latitude || !business.longitude || !business.address) {
    return null;
  }

  const handleEditStart = () => {
    setIsEditing(true);
    setEditLatitude(business.latitude!.toString());
    setEditLongitude(business.longitude!.toString());
  };

  const handleEditSave = () => {
    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);
    
    if (!isNaN(lat) && !isNaN(lng) && onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditLatitude(business.latitude!.toString());
    setEditLongitude(business.longitude!.toString());
  };

  const openInMaps = () => {
    const coords = `${business.latitude},${business.longitude}`;
    const query = encodeURIComponent(business.name + ', ' + business.address);
    
    // Detect device type for optimal maps experience
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (isIOS) {
        // Use Apple Maps on iOS
        window.open(`http://maps.apple.com/?q=${query}&ll=${coords}`);
      } else {
        // Use Google Maps on Android
        window.open(`https://maps.google.com/?q=${coords}(${query})`);
      }
    } else {
      // Desktop - use Google Maps
      window.open(`https://maps.google.com/?q=${coords}(${query})`);
    }
  };

  // Check if Google Maps is loaded
  const isGoogleMapsLoaded = () => {
    return typeof window !== 'undefined' && window.google && window.google.maps;
  };

  const loadGoogleMaps = (apiKey: string) => {
    if (isGoogleMapsLoaded()) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setMapLoaded(false);
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded()) return;

    const businessLocation = { lat: business.latitude!, lng: business.longitude! };
    
    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 15,
      center: businessLocation,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'cooperative',
    });

    const markerInstance = new google.maps.Marker({
      position: businessLocation,
      map: mapInstance,
      title: business.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <circle cx="15" cy="15" r="4" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15),
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${business.name}</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">${business.address}</p>
        </div>
      `,
    });

    markerInstance.addListener('click', () => {
      infoWindow.open(mapInstance, markerInstance);
    });

    setMap(mapInstance);
    setMarker(markerInstance);
    setMapLoaded(true);
  };

  useEffect(() => {
    if (apiKeyLoading) return;
    
    if (apiKey) {
      loadGoogleMaps(apiKey);
    } else if (apiKeyError) {
      // Fallback to localStorage if database fetch failed
      const savedApiKey = localStorage.getItem('google_maps_api_key');
      if (savedApiKey) {
        loadGoogleMaps(savedApiKey);
      } else {
        setShowApiKeyInput(true);
      }
    } else {
      setShowApiKeyInput(true);
    }
  }, [apiKey, apiKeyLoading, apiKeyError]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualApiKey.trim()) {
      localStorage.setItem('google_maps_api_key', manualApiKey);
      setShowApiKeyInput(false);
      loadGoogleMaps(manualApiKey);
    }
  };

  // Fallback component when map can't be loaded
  const MapFallback = () => (
    <div 
      className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer transition-all duration-200 hover:opacity-90 rounded-lg overflow-hidden"
      onClick={openInMaps}
    >
      <div className="text-center p-4">
        <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="font-semibold text-blue-800 mb-2">View Location</h3>
        <p className="text-sm text-blue-600 mb-3">
          {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            openInMaps();
          }}
        >
          Open in Maps
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      {showTitle && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Location</span>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && !isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEditStart}
                  className="h-auto p-1"
                  title="Edit location"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {canEdit && isEditing && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditSave}
                    className="h-auto p-1 text-green-600 hover:text-green-700"
                    title="Save changes"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditCancel}
                    className="h-auto p-1 text-red-600 hover:text-red-700"
                    title="Cancel editing"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={openInMaps}
                className="h-auto p-1"
                title="Open in external maps"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="relative" style={{ height }}>
          {apiKeyLoading ? (
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : showApiKeyInput ? (
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center p-4">
              <div className="text-center space-y-4 max-w-sm">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-sm mb-2">Google Maps API Key Required</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    To display the interactive map, please enter your Google Maps API key.
                  </p>
                </div>
                <form onSubmit={handleApiKeySubmit} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Enter Google Maps API Key"
                    value={manualApiKey}
                    onChange={(e) => setManualApiKey(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button type="submit" size="sm" disabled={!manualApiKey.trim()} className="w-full h-7 text-xs">
                    Load Map
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground">
                  Get your API key from the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>
                </p>
              </div>
            </div>
          ) : mapLoaded ? (
            <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
          ) : (
            <MapFallback />
          )}
        </div>
        
        {isEditing && canEdit ? (
          <div className="p-3 bg-background border-t">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-latitude" className="text-xs text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="any"
                    value={editLatitude}
                    onChange={(e) => setEditLatitude(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="e.g. -4.6515"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-longitude" className="text-xs text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    id="edit-longitude"
                    type="number"
                    step="any"
                    value={editLongitude}
                    onChange={(e) => setEditLongitude(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="e.g. 55.4864"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleEditSave}
                  className="h-7 text-xs flex-1"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleEditCancel}
                  className="h-7 text-xs flex-1"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : business.address ? (
          <div className="p-3 bg-background">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground break-words">
                  {business.address}
                  {business.island && (
                    <span className="text-muted-foreground"> • {business.island}</span>
                  )}
                </p>
                {canEdit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {business.latitude.toFixed(6)}, {business.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default BusinessLocationMap;