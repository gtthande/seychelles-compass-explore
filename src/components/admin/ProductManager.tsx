import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  name: string;
  address: string;
  island: string;
}

const ProductManager: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [businessProducts, setBusinessProducts] = useState<BusinessProduct[]>([]);
  const [masterProducts, setMasterProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<BusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const categories = [
    'tours', 'equipment', 'food', 'accommodation', 'transport', 
    'activities', 'souvenirs', 'services', 'entertainment', 'health',
    'education', 'training', 'certification'
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-500' },
    { value: 'inactive', label: 'Inactive', color: 'bg-red-500' }
  ];

  // Load all data immediately on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load all three data sources in parallel for faster loading
        const [businessProductsResult, productsResult, businessesResult] = await Promise.all([
          fetchBusinessProducts({ limit: 200 }),
          fetchAllProducts(),
          supabase
            .from('businesses')
            .select('id, name, address, island')
            .eq('status', 'active')
            .order('name')
        ]);

        setBusinessProducts(businessProductsResult.businessProducts);
        setMasterProducts(productsResult);
        if (businessesResult.data) {
          setBusinesses(businessesResult.data);
        }
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

    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businessProducts, searchTerm, categoryFilter, businessFilter, statusFilter, priceRange]);


  const applyFilters = () => {
    let filtered = [...businessProducts];

    if (searchTerm) {
      filtered = filtered.filter(bp => {
        const productName = bp.product?.name || '';
        const title = bp.title_override || bp.product?.title || productName;
        const description = bp.description_override || bp.product?.description || '';
        const businessName = bp.business?.name || '';
        return (
          productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          businessName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(bp => bp.product?.category === categoryFilter);
    }

    if (businessFilter !== 'all') {
      filtered = filtered.filter(bp => bp.business_id === businessFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bp => bp.is_active === (statusFilter === 'active'));
    }

    if (priceRange.min) {
      filtered = filtered.filter(bp => (bp.price_from || 0) >= Number(priceRange.min));
    }

    if (priceRange.max) {
      filtered = filtered.filter(bp => {
        const maxPrice = bp.price_to || bp.price_from || 0;
        return maxPrice <= Number(priceRange.max);
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleStatusChange = async (id: string, isActive: boolean) => {
    try {
      const updated = await updateBusinessProduct(id, { is_active: isActive });
      if (updated) {
        setBusinessProducts(prev => 
          prev.map(bp => bp.id === id ? updated : bp)
        );
        toast({
          title: "Success",
          description: "Product status updated",
        });
      }
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
    if (!confirm('Are you sure you want to remove this product from the business?')) {
      return;
    }

    try {
      const success = await deleteBusinessProduct(id);
      if (success) {
        setBusinessProducts(prev => prev.filter(bp => bp.id !== id));
        toast({
          title: "Success",
          description: "Product removed successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to remove product",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (priceFrom: number | null, priceTo: number | null, currency: string = 'SCR') => {
    if (!priceFrom) return "Price on request";
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₨";
    if (priceTo && priceTo !== priceFrom) {
      return `${symbol}${priceFrom.toLocaleString()} - ${symbol}${priceTo.toLocaleString()}`;
    }
    return `${symbol}${priceFrom.toLocaleString()}`;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
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
                Manage business-product links • {filteredProducts.length} of {businessProducts.length} products
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/admin/products/create')} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Link Product to Business
            </Button>
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
            {(searchTerm || categoryFilter !== 'all' || businessFilter !== 'all' || statusFilter !== 'all' || priceRange.min || priceRange.max) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={businessFilter} onValueChange={setBusinessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All businesses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
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
              Link a product to a business to get started.
            </p>
            <Button onClick={() => navigate('/admin/products/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Link Product to Business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((bp) => {
                const productName = bp.product?.name || 'Unknown Product';
                const displayTitle = bp.title_override || bp.product?.title || productName;
                const displayDescription = bp.description_override || bp.product?.description || '';
                return (
                  <Card key={bp.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      {bp.product?.image_url ? (
                        <img
                          src={bp.product.image_url}
                          alt={displayTitle}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Package className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Badge className={bp.is_active ? 'bg-green-500' : 'bg-red-500'}>
                          {bp.is_active ? 'Active' : 'Inactive'}
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
                          {formatPrice(bp.price_from, bp.price_to, bp.currency_code)}
                        </span>
                        {bp.duration_minutes && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(bp.duration_minutes)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span className="truncate">{bp.business?.name}</span>
                      </div>
                      {bp.product?.category && (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Tag className="w-3 h-3" />
                          {bp.product.category}
                        </Badge>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/admin/products/edit/${bp.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(bp.id)}
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
              {paginatedProducts.map((bp) => {
                const productName = bp.product?.name || 'Unknown Product';
                const displayTitle = bp.title_override || bp.product?.title || productName;
                const displayDescription = bp.description_override || bp.product?.description || '';
                return (
                  <Card key={bp.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0">
                          {bp.product?.image_url ? (
                            <img
                              src={bp.product.image_url}
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
                              <Badge className={bp.is_active ? 'bg-green-500' : 'bg-red-500'}>
                                {bp.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm mt-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-lg">
                                {formatPrice(bp.price_from, bp.price_to, bp.currency_code)}
                              </span>
                            </div>
                            {bp.duration_minutes && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{formatDuration(bp.duration_minutes)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span>{bp.business?.name}</span>
                            </div>
                            {bp.product?.category && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {bp.product.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/products/edit/${bp.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(bp.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
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
