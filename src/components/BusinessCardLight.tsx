import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Globe, Star, Verified } from 'lucide-react';
import { Business } from '@/types/business';

interface BusinessCardLightProps {
  business: Business;
  onEdit?: (business: Business) => void;
  onView?: (business: Business) => void;
  isOwner?: boolean;
}

const BusinessCardLight: React.FC<BusinessCardLightProps> = React.memo(({ 
  business, 
  onEdit, 
  onView, 
  isOwner = false 
}) => {
  const handleView = () => {
    if (onView) {
      onView(business);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(business);
    }
  };

  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{business.title}</h3>
              {business.verified && (
                <Verified className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{business.address}</span>
            </div>
          </div>
          {isOwner && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="flex-shrink-0"
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Category and Rating */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {/* Category name would come from join - placeholder for now */}
              {business.category_id ? 'Categorized' : 'Uncategorized'}
            </Badge>
            {business.average_rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{business.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {business.description}
          </p>

          {/* Contact Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {business.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span className="truncate">{business.phone}</span>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span className="truncate">{business.email}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span className="truncate">Website</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BusinessCardLight.displayName = 'BusinessCardLight';

export default BusinessCardLight;
