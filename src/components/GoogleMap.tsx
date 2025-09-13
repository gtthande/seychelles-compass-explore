import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { useGoogleMapsApiKey } from '@/hooks/useGoogleMapsApiKey';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  address: string;
  island: string;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  verified: boolean;
  logo_url: string;
  cover_image_url: string;
  average_rating: number;
  total_reviews: number;
  created_at: string;
}

interface GoogleMapProps {
  businesses: Business[];
  selectedBusiness?: Business | null;
  onBusinessSelect?: (business: Business) => void;
}

const GoogleMap = ({ businesses, selectedBusiness, onBusinessSelect }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [manualApiKey, setManualApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const { apiKey, loading: apiKeyLoading, error: apiKeyError } = useGoogleMapsApiKey();

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
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded()) return;

    // Center on Seychelles
    const seychellesCenter = { lat: -4.6796, lng: 55.4920 };
    
    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 10,
      center: seychellesCenter,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    setMap(mapInstance);
  };

  const addMarkersToMap = () => {
    if (!map || !isGoogleMapsLoaded()) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    businesses.forEach((business) => {
      if (business.latitude && business.longitude) {
        const marker = new google.maps.Marker({
          position: { lat: business.latitude, lng: business.longitude },
          map: map,
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
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${business.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${business.category}</p>
              ${business.address ? `<p style="margin: 0 0 8px 0; font-size: 12px;"><strong>Address:</strong> ${business.address}</p>` : ''}
              ${business.description ? `<p style="margin: 0; font-size: 12px;">${business.description.substring(0, 100)}...</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          if (onBusinessSelect) {
            onBusinessSelect(business);
          }
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      map.fitBounds(bounds);
    }
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
        setShowApiInput(true);
      }
    } else {
      setShowApiInput(true);
    }
  }, [apiKey, apiKeyLoading, apiKeyError]);

  useEffect(() => {
    if (map && businesses.length > 0) {
      addMarkersToMap();
    }
  }, [map, businesses]);

  useEffect(() => {
    if (map && selectedBusiness && selectedBusiness.latitude && selectedBusiness.longitude) {
      map.setCenter({ lat: selectedBusiness.latitude, lng: selectedBusiness.longitude });
      map.setZoom(15);
    }
  }, [map, selectedBusiness]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualApiKey.trim()) {
      localStorage.setItem('google_maps_api_key', manualApiKey);
      setShowApiInput(false);
      loadGoogleMaps(manualApiKey);
    }
  };

  if (apiKeyLoading) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading map configuration...</p>
        </div>
      </div>
    );
  }

  if (showApiInput) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6">
          <MapPin className="w-16 h-16 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">Google Maps API Key Required</h3>
          <p className="text-sm text-muted-foreground">
            {apiKeyError 
              ? 'Unable to load API key from server. Please enter your Google Maps API key manually.'
              : 'To display the map, please enter your Google Maps API key. You can get one from the Google Cloud Console.'
            }
          </p>
          <form onSubmit={handleApiKeySubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="Enter Google Maps API Key"
              value={manualApiKey}
              onChange={(e) => setManualApiKey(e.target.value)}
            />
            <Button type="submit" disabled={!manualApiKey.trim()}>
              Load Map
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Your API key will be stored locally for future use.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-muted rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default GoogleMap;