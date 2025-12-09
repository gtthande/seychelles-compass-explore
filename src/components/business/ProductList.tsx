import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import { 
  Package, 
  Plus, 
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import ProductManager from "./ProductManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  price_override: number | null;
  currency_code: string;
  is_active: boolean;
  stock: number | null;
  business_id: string | null;
  created_at: string;
  updated_at: string;
  slug?: string | null;
}

const ITEMS_PER_PAGE = 12;

const ProductList = () => {
  const { business, loading } = useBusinessAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showProductManager, setShowProductManager] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = async () => {
    if (!business) return;

    try {
      setProductsLoading(true);
      
      // Query business_products for this business
      let query = supabase
        .from('business_products')
        .select(`
          id,
          business_id,
          product_id,
          title_override,
          description_override,
          price_override,
          is_active,
          created_at,
          updated_at,
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
            slug,
            created_at,
            updated_at
          )
        `, { count: 'exact' })
        .eq('business_id', business.id);

      // Apply filters
      if (searchTerm) {
        query = query.or(`
          product.title.ilike.%${searchTerm}%,
          product.description.ilike.%${searchTerm}%
        `);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform business_products data to match Product interface
      const transformedData = (data || []).map((bp: any) => {
        const displayTitle = bp.title_override || bp.product?.title || '';
        const displayDescription = bp.description_override || bp.product?.description || '';
        const displayPrice = bp.price_override || bp.product?.price || null;
        return {
          id: bp.id,
          title: displayTitle,
          description: displayDescription,
          image_url: bp.product?.image_url || null,
          price: displayPrice,
          price_override: bp.price_override || null,
          currency_code: 'SCR',
          is_active: bp.is_active,
          stock: bp.product?.stock || null,
          business_id: bp.business_id,
          created_at: bp.created_at,
          updated_at: bp.updated_at,
        };
      }) as Product[];
      
      setProducts(transformedData);
      setTotalProducts(count || 0);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (business) {
      fetchProducts();
    }
  }, [business, searchTerm, statusFilter, currentPage]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Delete from business_products (unlink product from business)
      const { error } = await supabase
        .from('business_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Removed",
        description: "The product has been successfully removed from your business.",
      });
      
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to remove product",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = !product.is_active;
    
    try {
      // Update is_active in business_products
      const { error } = await supabase
        .from('business_products')
        .update({ is_active: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Product is now ${newStatus ? 'active' : 'inactive'}`,
      });
      
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product status:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'draft':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
        <p className="text-muted-foreground">You don't have a business registered yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products & Services</h2>
          <p className="text-muted-foreground">{totalProducts} total products</p>
        </div>
        <Button onClick={() => setShowProductManager(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                {product.image_url && (
                  <div className="h-48 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg relative overflow-hidden">
                    <img 
                      src={product.image_url} 
                      alt={product.title || 'Product'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{product.title || 'Product'}</CardTitle>
                    <Badge className={getStatusColor(product.is_active ? 'active' : 'draft')}>
                      {product.is_active ? 'active' : 'inactive'}
                    </Badge>
                  </div>
                  {product.description && (
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center justify-between">
                    {product.price && (
                      <div className="text-lg font-semibold text-foreground">
                        {product.currency_code || 'SCR'} {product.price}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductManager(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(product)}
                    >
                      {product.is_active ? (
                        <EyeOff className="w-4 h-4 mr-1" />
                      ) : (
                        <Eye className="w-4 h-4 mr-1" />
                      )}
                      {product.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{product.title || 'this product'}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No Products Found' : 'No Products Yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Start by adding your first product or service.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setShowProductManager(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Manager Modal */}
      {showProductManager && (
        <ProductManager
          business={business}
          product={editingProduct}
          onClose={() => {
            setShowProductManager(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowProductManager(false);
            setEditingProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default ProductList;