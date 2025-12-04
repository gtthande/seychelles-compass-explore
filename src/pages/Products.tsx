import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServerSideData } from "@/hooks/useOptimizedData";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Grid, List, MapPin, Download, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  category: string | null;
  status: string | null;
  in_stock: boolean | null;
  images: string[] | null;
  catalogue_url: string | null;
  sku: string | null;
  unit: string | null;
  tags: string[] | null;
  published_at: string | null;
  business: {
    id: string;
    name: string;
    island: string | null;
    address: string | null;
  };
}

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [selectedIsland, setSelectedIsland] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  const categories = [
    { value: "food", label: "Food & Beverages" },
    { value: "accommodation", label: "Accommodation" },
    { value: "tours", label: "Tours & Activities" },
    { value: "transport", label: "Transportation" },
    { value: "retail", label: "Retail Products" },
    { value: "services", label: "Services" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" },
  ];

  const islands = [
    "Mahé", "Praslin", "La Digue", "Silhouette", "Curieuse", "Bird", "Denis"
  ];

  // Use optimized data fetching for products
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useServerSideData(
    'products_list',
    async () => {
      try {
        // Use products as base table with JOINs
        // Only show active business_products for active businesses
        let query = supabase
          .from('products')
          .select('*, business_products(*), businesses(*)', { count: 'exact' })
          .eq('business_products.is_active', true)
          .eq('businesses.status', 'active')
          .order('created_at', { ascending: false });

        // Apply filters
        if (searchTerm) {
          query = query.or(`
            name.ilike.%${searchTerm}%,
            description.ilike.%${searchTerm}%,
            business_products.notes.ilike.%${searchTerm}%
          `);
        }

        if (selectedCategory && selectedCategory !== "__all__") {
          query = query.eq('category', selectedCategory);
        }

        if (priceRange.min) {
          query = query.gte('business_products.price', parseFloat(priceRange.min));
        }

        if (priceRange.max) {
          query = query.lte('business_products.price', parseFloat(priceRange.max));
        }

        if (selectedIsland && selectedIsland !== "__all__") {
          query = query.eq('businesses.island', selectedIsland);
        }

        const { data, error, count } = await query.range(
          (currentPage - 1) * pageSize,
          currentPage * pageSize - 1
        );

        if (error) {
          console.error('[Products] Query error:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to load products",
            variant: "destructive",
          });
          throw error;
        }
      
        const totalCount = count || 0;
        setTotalPages(Math.ceil(totalCount / pageSize));
        
        // Transform products data to match Product interface
        // Products can have multiple business_products, so we flatten them
        const transformedData: Product[] = [];
        (data || []).forEach((product: any) => {
          if (product.business_products && Array.isArray(product.business_products)) {
            product.business_products.forEach((bp: any) => {
              if (bp.is_active && bp.businesses) {
                transformedData.push({
                  id: bp.id || product.id,
                  name: product.name || '',
                  description: product.description || null,
                  price: bp.price || null,
                  currency: bp.overrides?.currency || 'SCR',
                  category: product.category || null,
                  status: bp.is_active ? 'active' : 'inactive',
                  in_stock: bp.is_active,
                  images: product.image_url ? [product.image_url] : null,
                  catalogue_url: bp.overrides?.booking_url || null,
                  sku: null,
                  unit: null,
                  tags: null,
                  published_at: bp.created_at || product.created_at || null,
                  business: {
                    id: bp.businesses?.id || '',
                    name: bp.businesses?.name || '',
                    island: bp.businesses?.island || null,
                    address: bp.businesses?.address || null,
                  },
                });
              }
            });
          }
        });
        
        return transformedData;
      } catch (error: any) {
        console.error('[Products] Unexpected error:', error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load products",
          variant: "destructive",
        });
        return [];
      }
    },
    {
      cache: true,
      ttl: 30000 // 30 seconds cache
    }
  );

  // Update products state when data changes
  useEffect(() => {
    setProducts(productsData || []);
  }, [productsData]);

  // Update loading state
  useEffect(() => {
    setLoading(productsLoading);
  }, [productsLoading]);

  // Handle errors
  useEffect(() => {
    if (productsError) {
      toast({
        title: "Error",
        description: `Failed to load products: ${productsError}`,
        variant: "destructive",
      });
    }
  }, [productsError, toast]);

  // Refetch when filters change
  useEffect(() => {
    refetchProducts();
  }, [searchTerm, selectedCategory, priceRange, selectedIsland, currentPage, refetchProducts]);

  const handleShare = (product: Product, platform?: 'facebook' | 'instagram' | 'link') => {
    const productUrl = `${window.location.origin}/products/${product.id}`;
    const shareText = `Check out ${product.name} from ${product.business.name} in Seychelles!`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${productUrl}`);
        toast({
          title: "Copied for Instagram",
          description: "Text copied to clipboard! Paste it in your Instagram post.",
        });
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: product.name,
            text: shareText,
            url: productUrl,
          });
        } else {
          navigator.clipboard.writeText(productUrl);
          toast({
            title: "Link Copied",
            description: "Product link copied to clipboard!",
          });
        }
    }
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "Price on request";
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₨";
    return `${symbol}${price.toLocaleString()}`;
  };

  const renderProductCard = (product: Product) => (
    <Card key={product.id} className="group hover:shadow-card-hover transition-all duration-300 bg-card border-border">
      <div className="relative overflow-hidden rounded-t-lg">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <span className="text-primary/60 text-sm">No image</span>
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs">
            Out of Stock
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 text-card-foreground">{product.name}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(product, 'facebook')}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(product, 'instagram')}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-600 hover:text-pink-700"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(product)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            {product.catalogue_url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <a href={product.catalogue_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="text-primary font-semibold">
          {formatPrice(product.price, product.currency)}
          {product.unit && <span className="text-muted-foreground text-sm">/{product.unit}</span>}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="line-clamp-2 mb-3 text-muted-foreground">
          {product.description}
        </CardDescription>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{product.business.name}</span>
            {product.business.island && <span>• {product.business.island}</span>}
          </div>

          {product.category && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {categories.find(c => c.value === product.category)?.label || product.category}
            </Badge>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{product.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderProductList = (product: Product) => (
    <Card key={product.id} className="group hover:shadow-card-hover transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                <span className="text-primary/60 text-xs">No image</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(product)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                {product.catalogue_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <a href={product.catalogue_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="text-primary font-semibold mb-2">
              {formatPrice(product.price, product.currency)}
              {product.unit && <span className="text-muted-foreground text-sm">/{product.unit}</span>}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{product.business.name}</span>
                {product.business.island && <span>• {product.business.island}</span>}
              </div>

              <div className="flex gap-2">
                {product.category && (
                  <Badge variant="secondary">
                    {categories.find(c => c.value === product.category)?.label || product.category}
                  </Badge>
                )}
                {!product.in_stock && (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-2">
            Products & Services
          </h1>
          <p className="text-muted-foreground">
            Discover amazing products and services from businesses across Seychelles
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6 mb-8 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
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
                <SelectItem value="__all__">All Islands</SelectItem>
                {islands.map((island) => (
                  <SelectItem key={island} value={island}>
                    {island}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="flex-1"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex-1"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Price Range</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Min"
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                />
                <Input
                  placeholder="Max"
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setPriceRange({ min: "", max: "" });
                  setSelectedIsland("");
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Progress value={50} className="w-64 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        )}

        {/* Products Grid/List */}
        {!loading && (
          <>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏝️</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 mb-8 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}>
                  {products.map(product => 
                    viewMode === "grid" ? renderProductCard(product) : renderProductList(product)
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;