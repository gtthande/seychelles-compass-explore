import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchBusinessProducts,
  createBusinessProduct,
  updateBusinessProduct,
  deleteBusinessProduct,
  fetchAllProducts,
  type BusinessProduct,
  type Product
} from '@/lib/products-api';
import { 
  Search, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  DollarSign,
  Image as ImageIcon,
  Tag,
  Building,
  MapPin,
  Calendar,
  Clock,
  Grid3x3,
  List as ListIcon,
  X
} from 'lucide-react';

interface Business {
  id: string;
  title: string;
  address: string;
  island: string;
}

const ProductManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [businessProducts, setBusinessProducts] = useState<BusinessProduct[]>([]);
  const [masterProducts, setMasterProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<BusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Category filter removed - products don't have category field
  // const [categoryFilter, setCategoryFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const lastLocationRef = useRef<string>('');

  // Categories removed - products don't have category field
  // const categories = [
  //   'tours', 'equipment', 'food', 'accommodation', 'transport', 
  //   'activities', 'souvenirs', 'services', 'entertainment', 'health',
  //   'education', 'training', 'certification'
  // ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-500' },
    { value: 'inactive', label: 'Inactive', color: 'bg-red-500' }
  ];

  // Load all data immediately on mount and when navigating back from create/edit
  const loadData = async () => {
    setLoading(true);
    try {
      // Load global products (master catalog) and business link counts
      const [productsResult, businessProductsResult] = await Promise.all([
        fetchAllProducts(),
        supabase
          .from('business_products')
          .select('product_id')
          .eq('is_active', true)
      ]);

      const products = productsResult || [];
      
      // Count how many businesses have linked each product
      const linkCounts: Record<string, number> = {};
      if (businessProductsResult.data) {
        businessProductsResult.data.forEach((bp: any) => {
          linkCounts[bp.product_id] = (linkCounts[bp.product_id] || 0) + 1;
        });
      }
      
      // Add link count to each product
      const productsWithCounts = products.map((p: any) => ({
        ...p,
        linkedBusinessCount: linkCounts[p.id] || 0
      }));

      setMasterProducts(productsWithCounts);
      setBusinessProducts([]); // Not used for global products view
    } catch (error) {
      console.error('Error loading products data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when navigating back from create/edit pages
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    // If we're coming back from a product create/edit page, refresh data
    if (lastLocationRef.current.includes('/admin/products/') && 
        currentPath === '/admin' && 
        lastLocationRef.current !== currentPath) {
      loadData();
    }
    lastLocationRef.current = currentPath;
  }, [location]);

  useEffect(() => {
    applyFilters();
  }, [masterProducts, searchTerm, businessFilter, statusFilter, priceRange]);


  const applyFilters = () => {
    // Filter global products (master catalog)
    let filtered = [...masterProducts];

    if (searchTerm) {
      filtered = filtered.filter(p => {
        const title = p.title || '';
        const description = p.description || '';
        return (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.is_active === (statusFilter === 'active'));
    }

    if (priceRange.min) {
      filtered = filtered.filter(p => {
        const displayPrice = p.price || 0;
        return displayPrice >= Number(priceRange.min);
      });
    }

    if (priceRange.max) {
      filtered = filtered.filter(p => {
        const displayPrice = p.price || 0;
        return displayPrice <= Number(priceRange.max);
      });
    }

    // Note: businessFilter is kept for future use but doesn't apply to global products
    // Global products are not tied to a specific business

    setFilteredProducts(filtered as any);
    setCurrentPage(1);
  };

  const handleStatusChange = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      
      setMasterProducts(prev => 
        prev.map(p => p.id === id ? { ...p, is_active: isActive } : p)
      );
      toast({
        title: "Success",
        description: "Product status updated",
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this global product? This will remove it from all businesses.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMasterProducts(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      loadData(); // Reload to refresh link counts
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (priceOverride: number | null, productPrice: number | null, currency: string = 'SCR') => {
    const price = priceOverride || productPrice;
    if (!price) return "Price on request";
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₨";
    return `${symbol}${price.toLocaleString()}`;
  };


  const clearFilters = () => {
    setSearchTerm('');
    setBusinessFilter('all');
    setStatusFilter('all');
    setPriceRange({ min: '', max: '' });
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Management
            </CardTitle>
            <CardDescription>Loading products...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-32 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Package className="w-6 h-6" />
                Product Management
              </CardTitle>
              <CardDescription className="mt-1">
                Manage global product catalog • {filteredProducts.length} of {masterProducts.length} products
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/admin/products/new')} size="lg" className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                + Add Global Product
              </Button>
              <Button onClick={() => navigate('/admin/products/create')} size="lg" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Link Product to Business
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
            {(searchTerm || businessFilter !== 'all' || statusFilter !== 'all' || priceRange.min || priceRange.max) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category filter removed - products don't have category field */}

            <Select value={businessFilter} onValueChange={setBusinessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All businesses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            />

            <Input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {paginatedProducts.length} of {filteredProducts.length} products
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first global product to get started.
            </p>
            <Button onClick={() => navigate('/admin/products/new')}>
              <Plus className="w-4 h-4 mr-2" />
              + Add Global Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product: any) => {
                const displayTitle = product.title || 'Unknown Product';
                const displayDescription = product.description || '';
                const linkedCount = product.linkedBusinessCount || 0;
                return (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={displayTitle}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Package className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Badge className={product.is_active ? 'bg-green-500' : 'bg-red-500'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{displayTitle}</CardTitle>
                      <CardDescription className="line-clamp-2">{displayDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {product.price ? `₨${product.price.toLocaleString()}` : 'Price on request'}
                        </span>
                        {product.duration && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {product.duration}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span className="truncate">
                          {linkedCount} {linkedCount === 1 ? 'business' : 'businesses'} linked
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedProducts.map((product: any) => {
                const displayTitle = product.title || 'Unknown Product';
                const displayDescription = product.description || '';
                const linkedCount = product.linkedBusinessCount || 0;
                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={displayTitle}
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-primary/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{displayTitle}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{displayDescription}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Badge className={product.is_active ? 'bg-green-500' : 'bg-red-500'}>
                                {product.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm mt-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-lg">
                                {product.price ? `₨${product.price.toLocaleString()}` : 'Price on request'}
                              </span>
                            </div>
                            {product.duration && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{product.duration}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span>{linkedCount} {linkedCount === 1 ? 'business' : 'businesses'} linked</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

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
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                );
              })}
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
    </div>
  );
};

export default ProductManager;
