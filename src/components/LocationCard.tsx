/**
 * LocationCard.tsx – iCompass Seychelles
 * Displays parsed location with Google Maps action buttons
 * API-free location display component
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, Globe, Mail, ExternalLink } from 'lucide-react';

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
  // Generate Google Maps URLs
  const mapsLink = link || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '#');
  const dirLink = latitude && longitude ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` : '#';

  // Format coordinates for display
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Validate coordinates are in Seychelles range
  const isValidSeychellesLocation = (lat: number, lng: number) => {
    return lat >= -10 && lat <= -4 && lng >= 55 && lng <= 56;
  };

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
      {latitude && longitude && (
        <div className="text-sm text-gray-600">
          <strong>Coordinates:</strong> {formatCoordinates(latitude, longitude)}
          {!isValidSeychellesLocation(latitude, longitude) && (
            <span className="ml-2 text-orange-600 text-xs">⚠️ Outside Seychelles</span>
          )}
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
      {process.env.NODE_ENV === 'development' && (latitude || longitude) && (
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

export default LocationCard;