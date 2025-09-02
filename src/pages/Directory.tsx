import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import LiveCounters from "@/components/LiveCounters";
import GoogleMap from "@/components/GoogleMap";
import ImageSearch from "@/components/ImageSearch";
import SearchWithTypeahead from "@/components/SearchWithTypeahead";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Heart,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Clock,
  Verified,
  Map,
  List,
  Filter,
  ExternalLink
} from "lucide-react";

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
  services?: string[];
}

const Directory = () => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIsland, setSelectedIsland] = useState("");
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const categories = [
    { value: "food", label: "Food & Beverages" },
    { value: "accommodation", label: "Accommodation" },
    { value: "tours", label: "Tours & Activities" },
    { value: "transport", label: "Transportation" },
    { value: "retail", label: "Retail Products" },
    { value: "services", label: "Services" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" }
  ];

  const islands = ["Mahé", "Praslin", "La Digue", "Silhouette", "Curieuse", "Bird", "Denis"];
  
  const handleImageSearchResults = (results: {
    categories: string[];
    keywords: string[];
    searchQuery: string;
    description: string;
  }) => {
    // Apply image search results to filters
    if (results.categories.length > 0) {
      setSelectedCategory(results.categories[0]);
    }
    setSearchTerm(results.searchQuery);
    
    toast({
      title: "Image Search Applied",
      description: `Found ${results.categories.join(', ')} - searching for: ${results.searchQuery}`,
    });
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    // Apply all filters
    let filtered = businesses;
    
    // Full-text search across multiple fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(business => 
        business.name.toLowerCase().includes(searchLower) ||
        business.description?.toLowerCase().includes(searchLower) ||
        business.category.toLowerCase().includes(searchLower) ||
        business.address?.toLowerCase().includes(searchLower) ||
        business.services?.some(service => service.toLowerCase().includes(searchLower))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(business => business.category === selectedCategory);
    }

    if (selectedIsland) {
      filtered = filtered.filter(business => business.island === selectedIsland);
    }
    
    // WhatsApp filter
    if (hasWhatsApp) {
      filtered = filtered.filter(business => business.whatsapp && business.whatsapp.trim() !== '');
    }
    
    // Featured filter
    if (showFeatured) {
      filtered = filtered.filter(business => business.featured);
    }

    setFilteredBusinesses(filtered);
  }, [businesses, searchTerm, selectedCategory, selectedIsland, hasWhatsApp, showFeatured]);
  
  const openInMaps = (business: Business) => {
    if (business.latitude && business.longitude) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const coords = `${business.latitude},${business.longitude}`;
      const query = encodeURIComponent(business.name + ', ' + business.address);
      
      if (isMobile) {
        // Try Apple Maps first on iOS, Google Maps on Android
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIOS) {
          window.open(`http://maps.apple.com/?q=${query}&ll=${coords}`);
        } else {
          window.open(`https://maps.google.com/?q=${coords}(${query})`);
        }
      } else {
        // Desktop - use Google Maps
        window.open(`https://maps.google.com/?q=${coords}(${query})`);
      }
    } else {
      // Fallback to address search
      const query = encodeURIComponent(business.name + ', ' + business.address + ', Seychelles');
      window.open(`https://maps.google.com/?q=${query}`);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching businesses:', error);
        toast({
          title: "Error",
          description: "Failed to load businesses. Please try again.",
          variant: "destructive",
        });
      } else {
        setBusinesses(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCategory = (category: string) => {
    const found = categories.find(c => c.value === category);
    return found ? found.label : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const BusinessCard = ({ business, onViewOnMap }: { business: Business; onViewOnMap?: () => void }) => (
    <Card className="hover:shadow-card-hover transition-all duration-300 border-border/50">
      <div className="relative">
        {business.cover_image_url ? (
          <div className="h-48 relative overflow-hidden rounded-t-lg">
            <img 
              src={business.cover_image_url} 
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
            <span className="text-primary/60 text-sm">No image</span>
          </div>
        )}
        {business.featured && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground border-0">
            Featured
          </Badge>
        )}
        {business.verified && (
          <Badge variant="secondary" className="absolute top-2 right-2">
            <Verified className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">{business.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {formatCategory(business.category)}
            </CardDescription>
          </div>
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={`${business.name} logo`}
              className="w-12 h-12 rounded-lg object-cover ml-3"
            />
          )}
        </div>
        
        {business.average_rating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium ml-1">{business.average_rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({business.total_reviews} review{business.total_reviews !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {business.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {business.description}
          </p>
        )}
        
        {business.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{business.address}</span>
            {business.island && <Badge variant="outline" className="ml-auto">{business.island}</Badge>}
          </div>
        )}
        
        <Separator />
        
        <div className="flex flex-wrap gap-2">
          {business.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${business.phone}`}>
                <Phone className="w-4 h-4 mr-1" />
                Call
              </a>
            </Button>
          )}
          
          {business.whatsapp && (
            <Button variant="outline" size="sm" asChild>
              <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-1 text-green-600" />
                WhatsApp
              </a>
            </Button>
          )}
          
          {business.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${business.email}`}>
                <Mail className="w-4 h-4 mr-1" />
                Email
              </a>
            </Button>
          )}
          
          {business.website && (
            <Button variant="outline" size="sm" asChild>
              <a href={business.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-1" />
                Website
              </a>
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {business.facebook_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={business.facebook_url} target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-4 h-4 text-blue-600" />
                </a>
              </Button>
            )}
            
            {business.instagram_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={business.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-4 h-4 text-pink-600" />
                </a>
              </Button>
            )}
            
            {business.linkedin_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={business.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 text-blue-700" />
                </a>
              </Button>
            )}
            
            {business.youtube_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={business.youtube_url} target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-4 h-4 text-red-600" />
                </a>
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {(business.latitude && business.longitude) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInMaps(business)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Maps
              </Button>
            )}
            
            {onViewOnMap && (
              <Button variant="outline" size="sm" onClick={onViewOnMap}>
                <Map className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-4">
            iCompass Business Directory
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover local businesses across the beautiful islands of Seychelles
          </p>
        </div>

        {/* Live Counters */}
        <LiveCounters />

        {/* Search and Filters */}
        <div className="bg-card rounded-xl p-6 shadow-card mb-8">
          {/* Image Search */}
          <ImageSearch onSearchResults={handleImageSearchResults} />
          
          {/* Main Search */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
              <SearchWithTypeahead
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search businesses, products, services..."
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIsland} onValueChange={setSelectedIsland}>
              <SelectTrigger>
                <SelectValue placeholder="All Islands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Islands</SelectItem>
                {islands.map((island) => (
                  <SelectItem key={island} value={island}>
                    {island}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="whatsapp" 
                checked={hasWhatsApp}
                onCheckedChange={setHasWhatsApp}
              />
              <label htmlFor="whatsapp" className="text-sm font-medium cursor-pointer">
                Has WhatsApp
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featured" 
                checked={showFeatured}
                onCheckedChange={setShowFeatured}
              />
              <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                Featured Only
              </label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedIsland("");
                setHasWhatsApp(false);
                setShowFeatured(false);
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <GoogleMap 
              businesses={filteredBusinesses}
              selectedBusiness={selectedBusiness}
              onBusinessSelect={setSelectedBusiness}
            />
            {selectedBusiness && (
              <Card>
                <CardContent className="pt-6">
                  <BusinessCard business={selectedBusiness} />
                </CardContent>
              </Card>
            )}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <BusinessCard 
                key={business.id} 
                business={business}
                onViewOnMap={() => {
                  setSelectedBusiness(business);
                  setViewMode('map');
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No businesses found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or browse all categories.
              </p>
            </div>
            <Button onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedIsland("");
              setHasWhatsApp(false);
              setShowFeatured(false);
            }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Directory;