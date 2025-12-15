import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star,
  Heart,
  MessageCircle,
  ExternalLink,
  Navigation,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  address?: string;
  island?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  featured?: boolean;
  rating?: number;
  whatsapp?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
}

interface BusinessTableProps {
  businesses: Business[];
  searchTerm?: string;
}

const BusinessTable: React.FC<BusinessTableProps> = ({ businesses, searchTerm }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const navigate = useNavigate();

  const toggleRow = (businessId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(businessId)) {
      newExpanded.delete(businessId);
    } else {
      newExpanded.add(businessId);
    }
    setExpandedRows(newExpanded);
  };

  const formatCategory = (category: string) => {
    const categoryLabels: Record<string, string> = {
      food: 'Food & Beverages',
      accommodation: 'Accommodation',
      tours: 'Tours & Activities',
      transport: 'Transportation',
      retail: 'Retail Products',
      services: 'Services',
      entertainment: 'Entertainment',
      education: 'Education',
      diving: 'Diving',
      hotels: 'Hotels',
      restaurant: 'Restaurant',
      other: 'Other'
    };
    return categoryLabels[category] || category;
  };

  const openInMaps = (business: Business) => {
    if (business.latitude && business.longitude) {
      const url = `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
      window.open(url, '_blank');
    } else if (business.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`;
      window.open(url, '_blank');
    }
  };

  const getDirections = (business: Business) => {
    if (business.latitude && business.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
      window.open(url, '_blank');
    } else if (business.address) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`;
      window.open(url, '_blank');
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchTerm ? `No results found for "${searchTerm}"` : 'No businesses found'}
          </h3>
          <p className="text-muted-foreground">
            Try different search terms or browse all available options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Click Instruction */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-primary">
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium">Click any row to view detailed information and location map</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
          <div className="col-span-1"></div>
          <div className="col-span-3">Business Name</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-1">Rating</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Rows */}
      {businesses.map((business) => {
        const isExpanded = expandedRows.has(business.id);
        
        return (
          <Card key={business.id} className="overflow-hidden">
            {/* Main Row */}
            <div 
              className="grid grid-cols-12 gap-4 items-center p-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 border-l-4 border-transparent hover:border-primary/30 group"
              onClick={() => toggleRow(business.id)}
            >
              {/* Expand/Collapse Icon */}
              <div className="col-span-1 flex justify-center">
                <div className="p-1 rounded-full bg-muted/50 group-hover:bg-primary/20 transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  )}
                </div>
              </div>

              {/* Business Name */}
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {business.title}
                  </h3>
                  {business.featured && (
                    <Badge variant="secondary" className="text-xs">
                      Featured
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">
                    Click to expand
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs">
                  {formatCategory(business.category)}
                </Badge>
              </div>

              {/* Location */}
              <div className="col-span-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {business.island || business.address || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  {business.phone && (
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  )}
                  {business.email && (
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  )}
                  {business.website && (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm">
                    {business.rating ? business.rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/business/${business.id}`);
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Row Content */}
            {isExpanded && (
              <div className="border-t bg-muted/20">
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Business Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">
                          {business.description || 'No description available.'}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Contact Information</h4>
                        <div className="space-y-2">
                          {business.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{business.phone}</span>
                            </div>
                          )}
                          {business.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{business.email}</span>
                            </div>
                          )}
                          {business.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <a 
                                href={business.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                          {business.whatsapp && (
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{business.whatsapp}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Location</h4>
                        <div className="space-y-2">
                          {business.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <span className="text-sm">{business.address}</span>
                            </div>
                          )}
                          {business.island && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {business.island}
                              </Badge>
                            </div>
                          )}
                          {(business.latitude && business.longitude) && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Coordinates: {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInMaps(business)}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View in Maps
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => getDirections(business)}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                        </Button>
                      </div>
                    </div>

                    {/* Right Column - Location Actions */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Location</h4>
                        {(business.latitude && business.longitude) || business.address ? (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              {(business.latitude && business.longitude) ? (
                                <>
                                  <a
                                    href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm transition-colors"
                                  >
                                    <MapPin className="w-4 h-4 mr-2" /> View in Maps
                                  </a>
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                                  >
                                    <Navigation className="w-4 h-4 mr-2" /> Get Directions
                                  </a>
                                </>
                              ) : business.address ? (
                                <>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm transition-colors"
                                  >
                                    <MapPin className="w-4 h-4 mr-2" /> View in Maps
                                  </a>
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                                  >
                                    <Navigation className="w-4 h-4 mr-2" /> Get Directions
                                  </a>
                                </>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>📍 Click the buttons above to open Google Maps with this location</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm text-center p-4 bg-muted/30 rounded-lg">
                            📍 No location data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default BusinessTable;
