import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import LiveCounters from "@/components/LiveCounters";
import GoogleMap from "@/components/GoogleMap";
import ImageSearch from "@/components/ImageSearch";
import SearchWithTypeahead from "@/components/SearchWithTypeahead";
import BusinessLocationMap from "@/components/business/BusinessLocationMap";
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
  ExternalLink,
  ChevronDown
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
  subcategory?: string;
}

interface CategoryGroup {
  category: string;
  subcategories: {
    [key: string]: Business[];
  };
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

  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('slug, name')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        
        const categoryOptions = data?.map(cat => ({
          value: cat.slug,
          label: cat.name
        })) || [];
        
        setCategories(categoryOptions);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories
        setCategories([
          { value: "food", label: "Food & Beverages" },
          { value: "accommodation", label: "Accommodation" },
          { value: "tours", label: "Tours & Activities" },
          { value: "transport", label: "Transportation" },
          { value: "retail", label: "Retail Products" },
          { value: "services", label: "Services" },
          { value: "entertainment", label: "Entertainment" },
        ]);
      }
    };

    fetchCategories();
  }, []);

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
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
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

  // Group businesses by category and subcategory
  const groupBusinessesByCategory = (businesses: Business[]): CategoryGroup[] => {
    const grouped: { [category: string]: { [subcategory: string]: Business[] } } = {};

    businesses.forEach(business => {
      const category = formatCategory(business.category);
      const subcategory = business.subcategory || (business.verified ? 'Verified' : 'General');

      if (!grouped[category]) {
        grouped[category] = {};
      }
      if (!grouped[category][subcategory]) {
        grouped[category][subcategory] = [];
      }
      grouped[category][subcategory].push(business);
    });

    // Sort businesses alphabetically within each subcategory
    Object.keys(grouped).forEach(category => {
      Object.keys(grouped[category]).forEach(subcategory => {
        grouped[category][subcategory].sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    // Convert to array and sort categories
    return Object.keys(grouped)
      .sort()
      .map(category => ({
        category,
        subcategories: grouped[category]
      }));
  };

  const groupedBusinesses = groupBusinessesByCategory(filteredBusinesses);

  const BusinessListingCard = ({ business }: { business: Business }) => {
    const hasLocationData = business.latitude && business.longitude && business.address;
    
    return (
      <Card className="hover:shadow-sm transition-all duration-200 border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Business Info Column */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                      {business.name}
                    </h3>
                    {business.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Verified className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {business.featured && (
                      <Badge className="text-xs bg-primary text-primary-foreground">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {business.phone && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-1 hover:bg-accent"
                          asChild
                        >
                          <a href={`tel:${business.phone}`} className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            <span className="text-foreground hover:text-primary">{business.phone}</span>
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {business.email && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-1 hover:bg-accent"
                          asChild
                        >
                          <a href={`mailto:${business.email}`} className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            <span className="text-foreground hover:text-primary">{business.email}</span>
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>

                  {business.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{business.address}</span>
                      {business.island && (
                        <Badge variant="outline" className="ml-2">{business.island}</Badge>
                      )}
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="flex items-center gap-1">
                    {business.facebook_url && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a href={business.facebook_url} target="_blank" rel="noopener noreferrer">
                          <Facebook className="w-4 h-4 text-blue-600" />
                        </a>
                      </Button>
                    )}
                    
                    {business.instagram_url && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a href={business.instagram_url} target="_blank" rel="noopener noreferrer">
                          <Instagram className="w-4 h-4 text-pink-600" />
                        </a>
                      </Button>
                    )}

                    {business.website && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a href={business.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 text-primary" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {business.logo_url && (
                  <img 
                    src={business.logo_url} 
                    alt={`${business.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover ml-4 flex-shrink-0"
                  />
                )}
              </div>
            </div>

            {/* Location Map Column - Only show if location data exists */}
            {hasLocationData && (
              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <BusinessLocationMap 
                    business={business} 
                    height="160px" 
                    showTitle={false}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const CategoryAccordion = ({ categoryGroup }: { categoryGroup: CategoryGroup }) => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={categoryGroup.category} className="border-border/50">
        <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
          <div className="flex items-center justify-between w-full pr-4">
            <span>{categoryGroup.category}</span>
            <Badge variant="outline" className="ml-2">
              {Object.values(categoryGroup.subcategories).reduce((total, businesses) => total + businesses.length, 0)}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          {Object.entries(categoryGroup.subcategories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([subcategory, businesses]) => (
              <div key={subcategory} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{subcategory}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {businesses.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {businesses.map((business) => (
                    <BusinessListingCard key={business.id} business={business} />
                  ))}
                </div>
              </div>
            ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Seychelles Business Directory
          </h1>
          <p className="text-lg text-muted-foreground">
            Find trusted local businesses across the beautiful islands of Seychelles
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
                  onSelect={(result) => {
                    // Navigate to specific business or enhance search
                    if (result.type === 'business') {
                      const business = businesses.find(b => b.id === result.id);
                      if (business) {
                        setSelectedBusiness(business);
                        setViewMode('map');
                      }
                    }
                  }}
                  placeholder="Find businesses, services, or products..."
                />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Browse by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Browse All Types</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIsland} onValueChange={setSelectedIsland}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
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
                onCheckedChange={(checked) => setHasWhatsApp(checked === true)}
              />
              <label htmlFor="whatsapp" className="text-sm font-medium cursor-pointer">
                Can message instantly
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featured" 
                checked={showFeatured}
                onCheckedChange={(checked) => setShowFeatured(checked === true)}
              />
              <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                Top picks only
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
              Reset
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
                  <BusinessListingCard business={selectedBusiness} />
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
          <div className="space-y-6">
            {groupedBusinesses.map((categoryGroup) => (
              <CategoryAccordion key={categoryGroup.category} categoryGroup={categoryGroup} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try different search terms or browse all available options.
              </p>
            </div>
            <Button onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedIsland("");
              setHasWhatsApp(false);
              setShowFeatured(false);
            }}>
              Show All Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Directory;