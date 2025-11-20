/**
 * LocationCard.tsx – iCompass Seychelles
 * Displays parsed location with Google Maps action buttons
 * API-free location display component
 */

import React, { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation, Phone, Globe, Mail, ExternalLink, Copy, Check } from 'lucide-react';

interface LocationCardProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  link?: string;
  phone?: string;
  website?: string;
  email?: string;
  className?: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
  address,
  latitude,
  longitude,
  link,
  phone,
  website,
  email,
  className = ''
}) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Memoize Google Maps URLs to prevent recalculation on every render
  const mapsLink = useMemo(() => {
    return link || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '#');
  }, [link, latitude, longitude]);

  const dirLink = useMemo(() => {
    return latitude && longitude ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` : '#';
  }, [latitude, longitude]);

  // Memoize formatted coordinates
  const formattedCoordinates = useMemo(() => {
    if (!latitude || !longitude) return null;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }, [latitude, longitude]);

  // Memoize validation check
  const isValidSeychellesLocation = useMemo(() => {
    if (!latitude || !longitude) return false;
    return latitude >= -10 && latitude <= -4 && longitude >= 55 && longitude <= 56;
  }, [latitude, longitude]);

  // Handle button clicks to prevent event propagation
  const handleMapsClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow default behavior (opening in new tab) but prevent any parent handlers
    e.stopPropagation();
  }, []);

  const handleDirectionsClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow default behavior (opening in new tab) but prevent any parent handlers
    e.stopPropagation();
  }, []);

  // Handle copying coordinates
  const handleCopyCoordinates = useCallback(async () => {
    if (!formattedCoordinates) return;
    try {
      await navigator.clipboard.writeText(formattedCoordinates);
      setCopiedField('coords');
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
  }, [formattedCoordinates, toast]);

  return (
    <div className={`border rounded-xl p-4 bg-white shadow-sm space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-gray-800">Location & Contact</h4>
      </div>

      {/* Address */}
      {address && (
        <div className="text-sm text-gray-700">
          <strong>Address:</strong> {address}
        </div>
      )}

      {/* Coordinates */}
      {formattedCoordinates && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <strong>Coordinates:</strong> {formattedCoordinates}
            {!isValidSeychellesLocation && (
              <span className="text-orange-600 text-xs">⚠️ Outside Seychelles</span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyCoordinates}
            className="h-6 px-2"
            title="Copy coordinates to clipboard"
          >
            {copiedField === 'coords' ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <a 
            href={mapsLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1"
            onClick={handleMapsClick}
          >
            <ExternalLink className="w-3 h-3" />
            View in Maps
          </a>
        </Button>
        
        {latitude && longitude && (
          <Button
            asChild
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <a 
              href={dirLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
              onClick={handleDirectionsClick}
            >
              <Navigation className="w-3 h-3" />
              Get Directions
            </a>
          </Button>
        )}
      </div>

      {/* Contact Information */}
      {(phone || website || email) && (
        <div className="pt-2 border-t border-gray-200 space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Contact Information</h5>
          
          {phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-500" />
              <a href={`tel:${phone}`} className="hover:text-blue-600">
                {phone}
              </a>
            </div>
          )}
          
          {website && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4 text-gray-500" />
              <a 
                href={website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-600 underline"
              >
                {website}
              </a>
            </div>
          )}
          
          {email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-500" />
              <a href={`mailto:${email}`} className="hover:text-blue-600">
                {email}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Debug Info (only in development) */}
      {import.meta.env.DEV && (latitude || longitude) && (
        <div className="pt-2 border-t border-gray-200 text-xs text-gray-400">
          <details>
            <summary className="cursor-pointer">Debug Info</summary>
            <div className="mt-1 space-y-1">
              <div>Lat: {latitude}</div>
              <div>Lng: {longitude}</div>
              <div>Link: {link || 'Generated'}</div>
              <div>Maps URL: {mapsLink}</div>
              <div>Directions URL: {dirLink}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(LocationCard);