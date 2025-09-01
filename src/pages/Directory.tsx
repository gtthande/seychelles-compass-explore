import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import LiveCounters from "@/components/LiveCounters";
import GoogleMap from "@/components/GoogleMap";
import { 
  Search, 
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
  List
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
}

const Directory = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIsland, setSelectedIsland] = useState<string>("all");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "restaurants", label: "Restaurants" },
    { value: "hotels", label: "Hotels" },
    { value: "tourism", label: "Tourism" },
    { value: "retail", label: "Retail" },
    { value: "services", label: "Services" },
    { value: "entertainment", label: "Entertainment" },
    { value: "health", label: "Health" },
    { value: "education", label: "Education" },
    { value: "finance", label: "Finance" },
    { value: "transport", label: "Transport" },
    { value: "real_estate", label: "Real Estate" },
    { value: "technology", label: "Technology" },
  ];

  const islands = [
    { value: "all", label: "All Islands" },
    { value: "Mahe", label: "Mahé" },
    { value: "Praslin", label: "Praslin" },
    { value: "La Digue", label: "La Digue" },
    { value: "Other", label: "Other Islands" },
  ];

  useEffect(() => {
    fetchBusinesses();
  }, [selectedCategory, selectedIsland, searchTerm]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq('category', selectedCategory as any);
      }

      if (selectedIsland !== "all") {
        query = query.eq('island', selectedIsland);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

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
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const BusinessCard = ({ business, onViewOnMap }: { business: Business; onViewOnMap?: () => void }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
      <div className="relative">
        {business.cover_image_url && (
          <div className="h-48 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg relative overflow-hidden">
            <img 
              src={business.cover_image_url} 
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {business.featured && (
          <Badge className="absolute top-2 left-2 bg-gradient-elegant text-white border-0">
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
                <MessageCircle className="w-4 h-4 mr-1" />
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
        
        <div className="flex gap-2 pt-2">
          {business.facebook_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={business.facebook_url} target="_blank" rel="noopener noreferrer">
                <Facebook className="w-4 h-4" />
              </a>
            </Button>
          )}
          
          {business.instagram_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={business.instagram_url} target="_blank" rel="noopener noreferrer">
                <Instagram className="w-4 h-4" />
              </a>
            </Button>
          )}
          
          {business.linkedin_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={business.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4" />
              </a>
            </Button>
          )}
          
          {business.youtube_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={business.youtube_url} target="_blank" rel="noopener noreferrer">
                <Youtube className="w-4 h-4" />
              </a>
            </Button>
          )}

          {business.latitude && business.longitude && onViewOnMap && (
            <Button variant="outline" size="sm" onClick={onViewOnMap}>
              <MapPin className="w-4 h-4 mr-1" />
              View on Map
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">iCompass Business Directory</h1>
        <p className="text-lg text-muted-foreground">
          Discover local businesses across the beautiful islands of Seychelles
        </p>
      </div>

      {/* Live Counters */}
      <LiveCounters />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedIsland} onValueChange={setSelectedIsland}>
          <SelectTrigger>
            <SelectValue placeholder="Select island" />
          </SelectTrigger>
          <SelectContent>
            {islands.map((island) => (
              <SelectItem key={island.value} value={island.value}>
                {island.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBusinesses} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-l-none"
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <GoogleMap 
            businesses={businesses}
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
      ) : businesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
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
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No businesses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all categories.
            </p>
          </div>
          <Button onClick={() => {
            setSearchTerm("");
            setSelectedCategory("all");
            setSelectedIsland("all");
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default Directory;