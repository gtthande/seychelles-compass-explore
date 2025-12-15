/**
 * Products API Helper
 * 
 * Handles product operations using the many-to-many business_products model:
 * - products = master catalogue (no business_id)
 * - business_products = business-specific instance with pricing, duration, notes
 */

import { supabase } from "@/integrations/supabase/client";
import { getServiceClient } from "@/integrations/supabase/service-client";

/**
 * Business Product (join table row with product and business data)
 * Normalized structure: { id: join_id, product: {...}, business: {...} }
 */
export interface BusinessProduct {
    id: string;
    business_id: string;
    product_id: string;
    price: number | null;
    duration: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Joined data - normalized structure with all fields
    business?: {
        id: string;
        owner_id: string | null;
        title: string;
        description: string | null;
        category_id: string | null;
        category: string | null;
        status: string;
        phone: string | null;
        email: string | null;
        website: string | null;
        address: string | null;
        latitude: number | null;
        longitude: number | null;
        island: string | null;
        opening_hours: any | null;
        services: string[] | null;
        featured: boolean | null;
        verified: boolean | null;
        logo_url: string | null;
        cover_image_url: string | null;
        gallery_images: string[] | null;
        average_rating: number | null;
        total_reviews: number | null;
        created_at: string;
        updated_at: string;
    };
    product?: {
        id: string;
        name: string;
        description: string | null;
        category_id: string | null;
        image_url: string | null;
        status: string | null;
        searchable: boolean | null;
        duration: string | null;
        price: number | null;
        is_active: boolean;
        created_at: string;
        updated_at: string;
    };
}

/**
 * Product interface matching database schema
 * NOTE: products table uses `name` (NOT `title`)
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  image_url: string | null;
  price: number | null;
  duration: string | null;
  slug: string | null;
  is_active: boolean;
  searchable: boolean | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for fetching business products
 */
export interface BusinessProductListParams {
    search?: string;
    businessId?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

/**
 * Fetch products with business_products and businesses JOINs
 * Note: This function queries business_products, not products directly
 * Returns normalized structure: { id: join_id, product: {...}, business: {...} }
 */
export async function fetchProducts(
    params: BusinessProductListParams = {}
): Promise<{ products: any[]; total: number }> {
    try {
        // Query business_products with many-to-many join pattern
        // This matches: SELECT business_products.id, products.*, businesses.*
        // Returns normalized: { id: join_id, product: {...}, business: {...} }
        let query = supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        price,
        duration,
        is_active,
        created_at,
        updated_at,
        business:businesses (
          id,
          owner_id,
          title,
          description,
          category_id,
          category,
          status,
          phone,
          email,
          website,
          address,
          latitude,
          longitude,
          island,
          opening_hours,
          services,
          featured,
          verified,
          logo_url,
          cover_image_url,
          gallery_images,
          average_rating,
          total_reviews,
          created_at,
          updated_at
        ),
        product:products (
          id,
          name,
          description,
          category_id,
          image_url,
          price,
          duration,
          slug,
          is_active,
          searchable
        )
      `, { count: 'exact' });

        // Apply filters
        if (params.businessId) {
            query = query.eq('business_id', params.businessId);
        }

        if (params.isActive !== undefined) {
            query = query.eq('is_active', params.isActive);
        }

        if (params.priceMin !== undefined) {
            query = query.gte('price', params.priceMin);
        }

        if (params.priceMax !== undefined) {
            query = query.lte('price', params.priceMax);
        }

        if (params.category) {
            query = query.eq('product.category_id', params.category);
        }

        if (params.search) {
            query = query.or(`
        product.name.ilike.%${params.search}%,
        product.description.ilike.%${params.search}%
      `);
        }

        // Apply pagination
        const limit = params.limit || 100;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1);

        // Order by product_id
        query = query.order('product_id');

        const { data, error, count } = await query;

        if (error) {
            console.error('[fetchProducts] Error:', error);
            console.error('[fetchProducts] Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        return {
            products: (data ?? []) as any[],
            total: count ?? 0,
        };
    } catch (error: any) {
        console.error('[fetchProducts] Unexpected error:', error);
        console.error('[fetchProducts] Error details:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        throw error;
    }
}

/**
 * Fetch business products with filters (legacy function for compatibility)
 * Uses safe query pattern: business_products LEFT JOIN products LEFT JOIN businesses
 * Returns normalized structure: { id: join_id, product: {...}, business: {...} }
 */
export async function fetchBusinessProducts(
    params: BusinessProductListParams = {}
): Promise<{ businessProducts: BusinessProduct[]; total: number }> {
    try {
        // Query business_products with joins to products and businesses
        // This matches: SELECT business_products.id, products.*, businesses.*
        // Returns normalized: { id: join_id, product: {...}, business: {...} }
        let query = supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        price,
        duration,
        is_active,
        created_at,
        updated_at,
        business:businesses (
          id,
          owner_id,
          title,
          description,
          category_id,
          category,
          status,
          phone,
          email,
          website,
          address,
          latitude,
          longitude,
          island,
          opening_hours,
          services,
          featured,
          verified,
          logo_url,
          cover_image_url,
          gallery_images,
          average_rating,
          total_reviews,
          created_at,
          updated_at
        ),
        product:products (
          id,
          name,
          description,
          category_id,
          image_url,
          price,
          duration,
          slug,
          is_active,
          searchable
        )
      `, { count: 'exact' });

        // Apply filters - only use fields that exist
        if (params.businessId) {
            query = query.eq('business_id', params.businessId);
        }

        if (params.isActive !== undefined) {
            query = query.eq('is_active', params.isActive);
        }

        if (params.priceMin !== undefined) {
            query = query.gte('price', params.priceMin);
        }

        if (params.priceMax !== undefined) {
            query = query.lte('price', params.priceMax);
        }

        if (params.category) {
            query = query.eq('product.category_id', params.category);
        }

        if (params.search) {
            query = query.or(`
        product.name.ilike.%${params.search}%,
        product.description.ilike.%${params.search}%
      `);
        }

        // Apply pagination
        const limit = params.limit || 100;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1);

        // Order by product_id
        query = query.order('product_id');

        const { data, error, count } = await query;

        if (error) {
            console.error('[fetchBusinessProducts] Error:', error);
            console.error('[fetchBusinessProducts] Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        return {
            businessProducts: (data ?? []) as BusinessProduct[],
            total: count ?? 0,
        };
    } catch (error: any) {
        console.error('[fetchBusinessProducts] Unexpected error:', error);
        console.error('[fetchBusinessProducts] Error details:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        throw error;
    }
}

/**
 * Create a master product (catalogue item)
 * Uses service role for writes
 */
export async function createProductMaster(
    productData: {
        name: string;
        description?: string;
        category_id?: string;
        image_url?: string;
        searchable?: boolean;
    }
): Promise<Product | null> {
    try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
            .from('products')
            .insert({
                name: productData.name,
                description: productData.description || null,
                category_id: productData.category_id || null,
                image_url: productData.image_url || null,
                is_active: true,
                searchable: productData.searchable ?? true,
            })
            .select(`
              id,
              name,
              description,
              category_id,
              image_url,
              price,
              duration,
              slug,
              is_active,
              searchable,
              created_at,
              updated_at
            `)
            .single();

        if (error) {
            console.error('[createProductMaster] Error:', error);
            throw error;
        }

        return data as Product;
    } catch (error: any) {
        console.error('[createProductMaster] Unexpected error:', error);
        throw error;
    }
}

/**
 * Create a business-product link
 * Uses service role for writes
 */
export async function createBusinessProduct(
    linkData: {
        business_id: string;
        product_id: string;
        price?: number | null;
        duration?: string | null;
        is_active?: boolean;
    }
): Promise<BusinessProduct | null> {
    try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
            .from('business_products')
            .insert({
                business_id: linkData.business_id,
                product_id: linkData.product_id,
                price: linkData.price || null,
                duration: linkData.duration || null,
                is_active: linkData.is_active ?? true,
            })
            .select(`
        id,
        business_id,
        product_id,
        price,
        duration,
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
          is_active,
          searchable
        ),
        business:businesses (
          id,
          title,
          description,
          category_id,
          status,
          address,
          island
        )
      `)
            .single();

        if (error) {
            console.error('[createBusinessProduct] Error:', error);
            throw error;
        }

        return data as BusinessProduct;
    } catch (error: any) {
        console.error('[createBusinessProduct] Unexpected error:', error);
        throw error;
    }
}

/**
 * Update a business-product link
 * Uses service role for writes
 */
export async function updateBusinessProduct(
    id: string,
    updates: Partial<{
        price: number | null;
        duration: string | null;
        is_active: boolean;
    }>
): Promise<BusinessProduct | null> {
    try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
            .from('business_products')
            .update(updates)
            .eq('id', id)
            .select(`
        id,
        business_id,
        product_id,
        price,
        duration,
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
          is_active,
          searchable
        ),
        business:businesses (
          id,
          title,
          description,
          category_id,
          status,
          address,
          island
        )
      `)
            .single();

        if (error) {
            console.error('[updateBusinessProduct] Error:', error);
            throw error;
        }

        return data as BusinessProduct;
    } catch (error: any) {
        console.error('[updateBusinessProduct] Unexpected error:', error);
        throw error;
    }
}

/**
 * Delete a business-product link
 * Uses service role for writes
 */
export async function deleteBusinessProduct(id: string): Promise<boolean> {
    try {
        const serviceClient = getServiceClient();
        const { error } = await serviceClient
            .from('business_products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[deleteBusinessProduct] Error:', error);
            throw error;
        }

        return true;
    } catch (error: any) {
        console.error('[deleteBusinessProduct] Unexpected error:', error);
        throw error;
    }
}

/**
 * Fetch all master products (for dropdown/selection)
 */
export async function fetchAllProducts(): Promise<Product[]> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
              id,
              name,
              description,
              category_id,
              image_url,
              price,
              duration,
              slug,
              is_active,
              searchable,
              created_at,
              updated_at
            `)
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('[fetchAllProducts] Error:', error);
            console.error('[fetchAllProducts] Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return [];
        }

        return (data ?? []) as Product[];
    } catch (error: any) {
        console.error('[fetchAllProducts] Unexpected error:', error);
        console.error('[fetchAllProducts] Error details:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        return [];
    }
}

/**
 * Attach a product to a business (create business_product link)
 */
export async function attachProductToBusiness(
    productId: string,
    businessId: string,
    overrides: {
        price?: number | null;
        duration?: string | null;
        is_active?: boolean;
    } = {}
): Promise<BusinessProduct | null> {
    return createBusinessProduct({
        business_id: businessId,
        product_id: productId,
        ...overrides,
    });
}

/**
 * Detach a product from a business (delete business_product link)
 */
export async function detachProductFromBusiness(id: string): Promise<boolean> {
    return deleteBusinessProduct(id);
}

/**
 * Update a business-product assignment
 */
export async function updateBusinessProductAssignment(
    id: string,
    overrides: {
        price?: number | null;
        duration?: string | null;
        is_active?: boolean;
    }
): Promise<BusinessProduct | null> {
    return updateBusinessProduct(id, overrides);
}

/**
 * Get all products (master catalogue) - for dropdown/selection
 * Alias for fetchAllProducts for consistency
 */
export async function getAllProducts(): Promise<Product[]> {
    return fetchAllProducts();
}

/**
 * Get products linked to a specific business
 */
export async function getProductsByBusiness(businessId: string): Promise<BusinessProduct[]> {
    try {
        const result = await fetchBusinessProducts({ businessId, limit: 1000 });
        return result.businessProducts;
    } catch (error: any) {
        console.error('[getProductsByBusiness] Error:', error);
        throw error;
    }
}

/**
 * Get all businesses linked to a specific product
 */
export async function getLinkedBusinessesForProduct(productId: string): Promise<BusinessProduct[]> {
    try {
        const { data, error } = await supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        price,
        duration,
        is_active,
        created_at,
        updated_at,
        business:businesses(
            id,
            title,
            address,
            island,
            status
        )
      `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getLinkedBusinessesForProduct] Error:', error);
            throw error;
        }

        return (data ?? []) as BusinessProduct[];
    } catch (error: any) {
        console.error('[getLinkedBusinessesForProduct] Unexpected error:', error);
        throw error;
    }
}

/**
 * Link a product to a business (create business_product link)
 * Alias for attachProductToBusiness for consistency
 */
export async function linkProductToBusiness(
    productId: string,
    businessId: string,
    overrides: {
        price?: number | null;
        duration?: string | null;
        is_active?: boolean;
    } = {}
): Promise<BusinessProduct | null> {
    return attachProductToBusiness(productId, businessId, overrides);
}

