import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search,
  X,
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  MessageCircle,
  Filter,
  Package,
  Building2,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { BusinessMapPreview } from "./BusinessMapPreview"; // Disabled for performance

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  logo_url: string | null;
  cover_image_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  address: string | null;
  island: string | null;
  phone: string | null;
  website: string | null;
  whatsapp: string | null;
  featured: boolean;
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  currency: string;
  is_active: boolean;
  stock: number;
  status: string;
  business_id: string | null;
  created_at: string;
  updated_at: string;
  slug?: string | null;
}

interface SearchFilterProps {
  onFiltersChange: (filters: {
    searchTerm: string;
    selectedCategory: string;
    showBusinesses: boolean;
    showProducts: boolean;
  }) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onFiltersChange }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showBusinesses, setShowBusinesses] = useState(true);
  const [showProducts, setShowProducts] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const businessChannel = supabase
      .channel('businesses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses',
          filter: 'status=eq.active'
        },
        () => {
          fetchData(); // Refetch when businesses change
        }
      )
      .subscribe();

    const productChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: 'status=eq.active'
        },
        () => {
          fetchData(); // Refetch when products change
        }
      )
      .subscribe();

    const categoryChannel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: 'is_active=eq.true'
        },
        () => {
          fetchData(); // Refetch when categories change
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(businessChannel);
      supabase.removeChannel(productChannel);
      supabase.removeChannel(categoryChannel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
    onFiltersChange({
      searchTerm,
      selectedCategory,
      showBusinesses,
      showProducts,
    });
  }, [searchTerm, selectedCategory, showBusinesses, showProducts, businesses, products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Optimized parallel queries with specific fields and limits
      const [categoriesResult, businessesResult, productsResult] = await Promise.all([
        // Fetch categories
        supabase
          .from('categories')
          .select('id, name, slug, description, is_active, created_at')
          .eq('is_active', true)
          .order('name')
          .limit(20), // Limit categories

        // Fetch businesses
        supabase
          .from('businesses')
          .select('*')
          .eq('status', 'active')
          .order('featured', { ascending: false })
          .order('name')
          .limit(50), // Limit businesses for performance

        // Fetch products
        supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            category,
            images,
            price,
            currency,
            stock,
            is_active,
            status,
            business_id,
            created_at,
            updated_at,
            slug
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100) // Limit products for performance
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (businessesResult.error) throw businessesResult.error;
      if (productsResult.error) throw productsResult.error;

      setCategories(categoriesResult.data || []);
      setBusinesses(businessesResult.data || []);
      setProducts(productsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredBiz = businesses;
    let filteredProd = products;

    // Enhanced search filter with relevance scoring
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      // Apply relevance scoring to businesses
      filteredBiz = filteredBiz
        .map(business => {
          let relevanceScore = 0;
          const name = business.name.toLowerCase();
          const description = business.description?.toLowerCase() || '';
          const address = business.address?.toLowerCase() || '';
          
          // Prioritize name matches
          if (name.includes(searchLower)) {
            relevanceScore += 100;
            if (name === searchLower) relevanceScore += 50;
            if (name.startsWith(searchLower)) relevanceScore += 25;
          }
          
          // Description match
          if (description.includes(searchLower)) {
            relevanceScore += 50;
          }
          
          // Address match
          if (address.includes(searchLower)) {
            relevanceScore += 25;
          }
          
          return { ...business, relevanceScore };
        })
        .filter(business => business.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 20); // Limit to top 20 businesses

      // Apply relevance scoring to products
      filteredProd = filteredProd
        .map(product => {
          let relevanceScore = 0;
          const name = product.name.toLowerCase();
          const description = product.description?.toLowerCase() || '';
          const businessName = product.businesses?.name?.toLowerCase() || '';
          
          // Prioritize product name matches
          if (name.includes(searchLower)) {
            relevanceScore += 100;
            if (name === searchLower) relevanceScore += 50;
            if (name.startsWith(searchLower)) relevanceScore += 25;
          }
          
          // Business name match
          if (businessName.includes(searchLower)) {
            relevanceScore += 75;
          }
          
          // Description match
          if (description.includes(searchLower)) {
            relevanceScore += 50;
          }
          
          return { ...product, relevanceScore };
        })
        .filter(product => product.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 20); // Limit to top 20 products
    }

    // Apply category filter
    if (selectedCategory) {
      filteredBiz = filteredBiz.filter(business => business.category === selectedCategory);
      filteredProd = filteredProd.filter(product => product.category === selectedCategory);
    }

    setFilteredBusinesses(filteredBiz);
    setFilteredProducts(filteredProd);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setShowBusinesses(true);
    setShowProducts(true);
  };

  const hasActiveFilters = searchTerm || selectedCategory || !showBusinesses || !showProducts;

  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category ? category.name : slug;
  };

  return (
    <div className="space-y-6">
      {/* Search and Category Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search businesses, products, services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="md:col-span-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content Type Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="businesses"
              checked={showBusinesses}
              onChange={(e) => setShowBusinesses(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="businesses" className="text-sm font-medium cursor-pointer">
              Businesses ({filteredBusinesses.length})
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="products"
              checked={showProducts}
              onChange={(e) => setShowProducts(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="products" className="text-sm font-medium cursor-pointer">
              Products ({filteredProducts.length})
            </label>
          </div>

          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto">
              <Filter className="w-3 h-3 mr-1" />
              Filters Active
            </Badge>
          )}
        </div>
      </Card>

      {/* Category Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 8).map((category) => (
          <Button
            key={category.slug}
            variant={selectedCategory === category.slug ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(selectedCategory === category.slug ? "" : category.slug)}
            className="rounded-full"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Businesses Section */}
          {showBusinesses && filteredBusinesses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Businesses ({filteredBusinesses.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.slice(0, 6).map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
              {filteredBusinesses.length > 6 && (
                <div className="text-center mt-6">
                  <Button variant="outline" asChild>
                    <a href="/directory">View All Businesses</a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Products Section */}
          {showProducts && filteredProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Products ({filteredProducts.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {filteredProducts.length > 8 && (
                <div className="text-center mt-6">
                  <Button variant="outline" asChild>
                    <a href="/products">View All Products</a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {(!showBusinesses || filteredBusinesses.length === 0) && 
           (!showProducts || filteredProducts.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters.
                </p>
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

const BusinessCard: React.FC<{ business: Business }> = ({ business }) => (
  <Card className="hover:shadow-lg transition-shadow">
    {/* Only show cover image if business uploaded one */}
    {business.cover_image_url && (
      <div className="relative">
        <div className="h-48 relative overflow-hidden rounded-t-lg">
          <img 
            src={business.cover_image_url} 
            alt={business.name}
            className="w-full h-full object-cover"
          />
        </div>
        {business.featured && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
      </div>
    )}
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold">{business.name}</CardTitle>
          <CardDescription className="text-sm">
            {business.category}
          </CardDescription>
          {!business.cover_image_url && business.featured && (
            <Badge className="bg-primary text-primary-foreground text-xs mt-2">
              Featured
            </Badge>
          )}
        </div>
        {business.logo_url && (
          <img 
            src={business.logo_url} 
            alt={`${business.name} logo`}
            className="w-10 h-10 rounded object-cover ml-3"
          />
        )}
      </div>
      
      {business.average_rating && business.average_rating > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium ml-1">{business.average_rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({business.total_reviews} reviews)
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
          <span className="line-clamp-1">{business.address}</span>
        </div>
      )}
      
      <div className="flex gap-2 pt-2">
        {business.phone && (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${business.phone}`}>
              <Phone className="w-4 h-4" />
            </a>
          </Button>
        )}
        {business.whatsapp && (
          <Button variant="outline" size="sm" asChild>
            <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
            </a>
          </Button>
        )}
        {business.website && (
          <Button variant="outline" size="sm" asChild>
            <a href={business.website} target="_blank" rel="noopener noreferrer">
              <Globe className="w-4 h-4" />
            </a>
          </Button>
        )}
      </div>
      
      {/* Temporarily disabled to fix hanging issue */}
            {/* Map preview disabled for performance - will be lazy-loaded in detail view */}
    </CardContent>
  </Card>
);

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const name = product?.name ?? "Unnamed";
  
  return (
  <Card className="hover:shadow-lg transition-shadow">
    <div className="relative">
      {product.images && product.images.length > 0 ? (
        <div className="h-40 relative overflow-hidden rounded-t-lg">
          <img 
            src={product.images[0]} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
          <Package className="w-8 h-8 text-primary/60" />
        </div>
      )}
    </div>
    
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold line-clamp-1">{name}</CardTitle>
      {product.businesses?.name && (
        <CardDescription className="text-xs">
          by {product.businesses.name}
        </CardDescription>
      )}
    </CardHeader>
    
    <CardContent className="space-y-2">
      {product.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
      )}
      
      {product.price && (
        <div className="text-lg font-semibold text-primary">
          {product.currency || 'SCR'} {product.price}
        </div>
      )}
    </CardContent>
  </Card>
  );
};

export default SearchFilter;