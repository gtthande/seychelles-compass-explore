import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProductForm from './ProductForm';

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

interface ProductListProps {
  businessId: string;
  isOwner?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ businessId, isOwner = false }) => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const highlightedProductId = searchParams.get('product');

  useEffect(() => {
    fetchProducts();
  }, [businessId]);

  useEffect(() => {
    if (highlightedProductId) {
      const element = document.getElementById(`product-${highlightedProductId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedProductId, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Note: Products table doesn't have business_id directly
      // Products are linked via business_products join table
      // This query needs to use business_products instead
      const { data, error } = await supabase
        .from('business_products')
        .select(`
          id,
          business_id,
          product_id,
          price,
          is_active,
          created_at,
          updated_at,
          product:products (
            id,
            name,
            description,
            category_id,
            image_url,
            price,
            duration,
            slug,
            is_active
          )
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ProductList] Query error:', error);
        console.error('[ProductList] Error details:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        });
        setProducts([]);
        throw error;
      }
      
      // Transform business_products data to match Product interface
      const transformedData = (data || []).map((bp: any) => {
        const product = bp.product || {};
        return {
          id: bp.id || product.id || '',
          name: product.name || 'Untitled Product',
          description: product.description || '',
          category: product.category_id || '',
          images: product.image_url ? [product.image_url] : [],
          price: bp.price || product.price || null,
          currency: 'SCR',
          stock: null,
          is_active: bp.is_active ?? true,
          status: bp.is_active ? 'active' : 'inactive',
          business_id: bp.business_id || '',
          created_at: bp.created_at || product.created_at || '',
          updated_at: bp.updated_at || product.updated_at || '',
          slug: product.slug || null,
        };
      }) as Product[];
      
      setProducts(transformedData);
    } catch (error: any) {
      console.error('[ProductList] Error fetching products:', error);
      console.error('[ProductList] Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load products',
        variant: 'destructive',
      });
      // Ensure loading state is cleared and show empty state
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products & Services</CardTitle>
            {isOwner && (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const isHighlighted = highlightedProductId === product.id;
                return (
                <Card 
                  key={product.id} 
                  className={`hover:shadow-md transition-shadow ${isHighlighted ? 'ring-2 ring-primary border-primary' : ''}`}
                  id={isHighlighted ? `product-${product.id}` : undefined}
                >
                  {(product.image_url || (product.images && product.images.length > 0)) && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={product.image_url || (product.images && product.images[0]) || ''}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    {product.price && (
                      <div className="text-lg font-semibold text-primary">
                        {product.price} SCR
                      </div>
                    )}
                  </CardHeader>
                  {isOwner && (
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ProductForm
          businessId={businessId}
          product={editingProduct}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </>
  );
};

export default ProductList;

