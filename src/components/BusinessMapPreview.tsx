import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { geocodeAddress } from '@/lib/geocoding';
import { MapPin, ExternalLink } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  address?: string;
  island?: string;
  lat?: number;
  lng?: number;
}

interface BusinessMapPreviewProps {
  business: Business;
  className?: string;
}

export const BusinessMapPreview: React.FC<BusinessMapPreviewProps> = ({ 
  business, 
  className = "" 
}) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const initializeMap = async () => {
      // If we already have coordinates, use them
      if (business.lat && business.lng) {
        setCoordinates({ lat: business.lat, lng: business.lng });
        return;
      }

      // If no coordinates but we have an address, try to geocode
      if (business.address && !isGeocoding) {
        setIsGeocoding(true);
        setGeocodingError(null);

        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Geocoding timeout')), 5000);
          });

          const geocodePromise = (async () => {
            // First try the Supabase function
            const { data: supabaseResult, error: supabaseError } = await supabase.functions.invoke('geocode-address', {
              body: { 
                address: business.address, 
                island: business.island 
              }
            });

            if (supabaseResult?.success && supabaseResult.latitude && supabaseResult.longitude) {
              const coords = { 
                lat: supabaseResult.latitude, 
                lng: supabaseResult.longitude 
              };
              setCoordinates(coords);

              // Save coordinates back to the database
              await supabase
                .from('businesses')
                .update({ 
                  lat: coords.lat, 
                  lng: coords.lng 
                })
                .eq('id', business.id);

              console.log(`Geocoded and cached coordinates for ${business.name}:`, coords);
              return;
            } else {
              // Fallback to client-side geocoding
              const result = await geocodeAddress(business.address, business.island);
              
              if ('latitude' in result && 'longitude' in result) {
                const coords = { 
                  lat: result.latitude, 
                  lng: result.longitude 
                };
                setCoordinates(coords);

                // Save coordinates back to the database
                await supabase
                  .from('businesses')
                  .update({ 
                    lat: coords.lat, 
                    lng: coords.lng 
                  })
                  .eq('id', business.id);

                console.log(`Client-side geocoded and cached coordinates for ${business.name}:`, coords);
              } else {
                setGeocodingError(result.error || 'Failed to geocode address');
              }
            }
          })();

          await Promise.race([geocodePromise, timeoutPromise]);

        } catch (error: any) {
          console.error('Geocoding error:', error);
          setGeocodingError(error.message || 'Failed to geocode address');
        } finally {
          setIsGeocoding(false);
        }
      }
    };

    initializeMap();
  }, [business.id, business.lat, business.lng, business.address, business.island]);

  const handleMapError = () => {
    setMapError(true);
  };

  if (!apiKey) {
    return (
      <div className={`mt-4 p-4 bg-muted rounded-lg text-center ${className}`}>
        <MapPin className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Google Maps API key not configured
        </p>
      </div>
    );
  }

  if (isGeocoding) {
    return (
      <div className={`mt-4 p-4 bg-muted rounded-lg text-center ${className}`}>
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">
          Finding location...
        </p>
      </div>
    );
  }

  if (geocodingError) {
    return (
      <div className={`mt-4 p-4 bg-muted rounded-lg text-center ${className}`}>
        <MapPin className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Unable to locate this business
        </p>
        {business.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + (business.island ? `, ${business.island}` : '') + ', Seychelles')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Search on Google Maps
          </a>
        )}
      </div>
    );
  }

  if (!coordinates) {
    return null;
  }

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${coordinates.lat},${coordinates.lng}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;

  return (
    <div className={`mt-4 ${className}`}>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
        title="Click to open directions in Google Maps"
      >
        <iframe
          width="100%"
          height="200"
          style={{ border: 0, borderRadius: "8px" }}
          loading="lazy"
          allowFullScreen
          src={mapUrl}
          onError={handleMapError}
          title={`Map of ${business.name}`}
        />
      </a>
      
      {mapError && (
        <div className="mt-2 text-center">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
};
