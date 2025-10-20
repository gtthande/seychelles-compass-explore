import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Phone, Globe, Navigation } from 'lucide-react';
import GoogleMapsEmbed from './GoogleMapsEmbed';

interface BusinessLocationCardProps {
  business: {
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    island?: string;
    phone?: string;
    website?: string;
    opening_hours?: any;
  };
  className?: string;
}

const BusinessLocationCard: React.FC<BusinessLocationCardProps> = ({
  business,
  className = ""
}) => {
  // Format opening hours for display
  const formatOpeningHours = (hours: any) => {
    if (!hours || typeof hours !== 'object') return null;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const formattedHours = [];
    
    for (const day of days) {
      if (hours[day.toLowerCase()]) {
        const dayHours = hours[day.toLowerCase()];
        if (dayHours.open && dayHours.close) {
          formattedHours.push(`${day}: ${dayHours.open} - ${dayHours.close}`);
        } else if (dayHours.open === 'closed') {
          formattedHours.push(`${day}: Closed`);
        }
      }
    }
    
    return formattedHours.length > 0 ? formattedHours : null;
  };

  const openingHours = formatOpeningHours(business.opening_hours);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Address</h4>
            <div className="text-sm text-muted-foreground">
              <p className="break-words">{business.address || 'Address not available'}</p>
              {business.island && (
                <Badge variant="outline" className="mt-2">
                  {business.island}
                </Badge>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {business.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a 
                    href={`tel:${business.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>
              </div>
            )}

            {business.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a 
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Opening Hours */}
          {openingHours && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Opening Hours
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {openingHours.map((hours, index) => (
                  <p key={index}>{hours}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <GoogleMapsEmbed
        businessName={business.name}
        address={business.address || 'Address not available'}
        latitude={business.latitude}
        longitude={business.longitude}
        height="400px"
        className="w-full"
      />
    </div>
  );
};

export default BusinessLocationCard;
