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

export interface Product {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  price_from?: number | null;
  price_to?: number | null;
  price_override?: number | null;
  currency_code?: string;
  duration?: string | null;
  is_active: boolean;
  stock?: number | null;
  business_id?: string | null;
  created_at: string;
  updated_at: string;
  slug?: string | null;
  business?: {
    id: string;
    name: string;
    island: string | null;
    address: string | null;
  };
  product?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: number | null;
    duration: string | null;
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
        // Query business_products with many-to-many join pattern
        let query = supabase
          .from('business_products')
          .select(`
            id,
            business_id,
            product_id,
            title_override,
            description_override,
            price_override,
            price_from,
            price_to,
            currency_code,
            is_active,
            created_at,
            updated_at,
            business:businesses (
              id,
              name,
              island,
              address,
              status
            ),
            product:products (
              id,
              title,
              description,
              price,
              duration,
              is_active,
              searchable,
              image_url,
              stock,
              business_id,
              slug,
              created_at,
              updated_at
            ),
            price_override
          `, { count: 'exact' })
          .eq('is_active', true)
          .eq('business.status', 'active')
          .order('created_at', { ascending: false });

        // Apply filters
        if (searchTerm) {
          query = query.or(`
            product.title.ilike.%${searchTerm}%,
            product.description.ilike.%${searchTerm}%
          `);
        }

        // Category filter removed - category no longer exists in products table
        // if (selectedCategory && selectedCategory !== "__all__") {
        //   query = query.eq('product.category', selectedCategory);
        // }

        if (priceRange.min) {
          query = query.or(`price_override.gte.${priceRange.min},price_from.gte.${priceRange.min}`);
        }

        if (priceRange.max) {
          query = query.or(`price_override.lte.${priceRange.max},price_to.lte.${priceRange.max}`);
        }

        if (selectedIsland && selectedIsland !== "__all__") {
          query = query.eq('business.island', selectedIsland);
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
        
        // Transform business_products data to match Product interface
        const transformedData = (data || []).map((bp: any) => ({
          id: bp.id,
          title: bp.title_override || bp.product?.title || '',
          description: bp.description_override || bp.product?.description || '',
          image_url: bp.product?.image_url || null,  // Single string, not array
          price_override: bp.price_override || null,
          price_from: bp.price_from || null,
          price_to: bp.price_to || null,
          price: bp.price_override || bp.price_from || bp.product?.price || null,  // Use price_override as primary
          currency_code: bp.currency_code || 'SCR',
          duration: bp.product?.duration || null,
          is_active: bp.is_active,
          stock: bp.product?.stock || 0,
          business_id: bp.business_id,
          created_at: bp.created_at,
          updated_at: bp.updated_at,
          slug: bp.product?.slug || null,
          business: bp.business,
          product: bp.product,
        })) as Product[];
        
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
    const businessName = product.business?.name || 'a local business';
    const shareText = `Check out ${product.title || 'this product'} from ${businessName} in Seychelles!`;
    
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
            title: product.title || 'Product',
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

  const formatPrice = (price: number | null | undefined, priceFrom: number | null | undefined, priceTo: number | null | undefined, currency: string | null | undefined) => {
    const currencyCode = currency || 'SCR';
    const symbol = currencyCode === "USD" ? "$" : currencyCode === "EUR" ? "€" : "₨";
    
    if (priceFrom && priceTo && priceFrom !== priceTo) {
      return `${symbol}${priceFrom.toLocaleString()} - ${symbol}${priceTo.toLocaleString()}`;
    }
    if (priceFrom) {
      return `From ${symbol}${priceFrom.toLocaleString()}`;
    }
    if (price) {
      return `${symbol}${price.toLocaleString()}`;
    }
    return "Price on request";
  };

  const renderProductCard = (product: Product) => (
    <Card key={product.id} className="group hover:shadow-card-hover transition-all duration-300 bg-card border-border">
      <div className="relative overflow-hidden rounded-t-lg">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title || 'Product'}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        {!product.image_url && (
          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <span className="text-primary/60 text-sm">No image</span>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 text-card-foreground">{product.title || 'Product'}</CardTitle>
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
          </div>
        </div>
        <div className="text-primary font-semibold">
          {formatPrice(product.price, product.price_from, product.price_to, product.currency_code)}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="line-clamp-2 mb-3 text-muted-foreground">
          {product.description}
        </CardDescription>

        <div className="space-y-2">
          {product.business?.name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{product.business.name}</span>
              {product.business.island && <span>• {product.business.island}</span>}
            </div>
          )}

          {/* Category and tags removed from products schema */}
        </div>
      </CardContent>
    </Card>
  );

  const renderProductList = (product: Product) => (
    <Card key={product.id} className="group hover:shadow-card-hover transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title || 'Product'}
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            {!product.image_url && (
              <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                <span className="text-primary/60 text-xs">No image</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{product.title || 'Product'}</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(product)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-primary font-semibold mb-2">
              {formatPrice(product.price, product.price_from, product.price_to, product.currency_code)}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              {product.business?.name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{product.business.name}</span>
                  {product.business.island && <span>• {product.business.island}</span>}
                </div>
              )}

              <div className="flex gap-2">
                {/* Category removed from products schema */}
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