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
 */
export interface BusinessProduct {
    id: string;
    business_id: string;
    product_id: string;
    title_override: string | null;
    description_override: string | null;
    price_from: number | null;
    price_to: number | null;
    currency_code: string;
    duration_minutes: number | null;
    booking_url: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Joined data
    business?: {
        id: string;
        name: string;
        address: string | null;
        island: string | null;
    };
    product?: {
        id: string;
        name: string;
        title: string | null;
        description: string | null;
        category: string | null;
        image_url: string | null;
        status: string | null;
    };
}

/**
 * Product interface matching database schema
 */
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
 */
export async function fetchProducts(
    params: BusinessProductListParams = {}
): Promise<{ products: any[]; total: number }> {
    try {
        // Query business_products with many-to-many join pattern
        let query = supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        business:businesses (
          id,
          name,
          address,
          island,
          category,
          status
        ),
        product:products (
          id,
          name,
          title,
          description,
          category,
          image_url,
          status,
          price,
          currency,
          in_stock,
          stock_quantity
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
            query = query.gte('price_from', params.priceMin);
        }

        if (params.priceMax !== undefined) {
            query = query.lte('price_to', params.priceMax);
        }

        if (params.category) {
            query = query.eq('product.category', params.category);
        }

        if (params.search) {
            query = query.or(`
        product.name.ilike.%${params.search}%,
        product.description.ilike.%${params.search}%,
        product.title.ilike.%${params.search}%,
        title_override.ilike.%${params.search}%,
        description_override.ilike.%${params.search}%,
        notes.ilike.%${params.search}%
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
            throw error;
        }

        return {
            products: (data ?? []) as any[],
            total: count ?? 0,
        };
    } catch (error: any) {
        console.error('[fetchProducts] Unexpected error:', error);
        throw error;
    }
}

/**
 * Fetch business products with filters (legacy function for compatibility)
 * Uses safe query pattern: business_products LEFT JOIN products LEFT JOIN businesses
 */
export async function fetchBusinessProducts(
    params: BusinessProductListParams = {}
): Promise<{ businessProducts: BusinessProduct[]; total: number }> {
    try {
        // Query business_products with joins to products and businesses
        // This is the correct approach for many-to-many relationships
        let query = supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        title_override,
        description_override,
        price_from,
        price_to,
        currency_code,
        duration_minutes,
        booking_url,
        notes,
        is_active,
        created_at,
        updated_at,
        business:businesses (
          id,
          name,
          address,
          island,
          category,
          status
        ),
        product:products (
          id,
          name,
          title,
          description,
          category,
          image_url,
          status,
          price,
          currency,
          in_stock,
          stock_quantity
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
            query = query.gte('price_from', params.priceMin);
        }

        if (params.priceMax !== undefined) {
            query = query.lte('price_to', params.priceMax);
        }

        if (params.category) {
            query = query.eq('product.category', params.category);
        }

        if (params.search) {
            query = query.or(`
        product.name.ilike.%${params.search}%,
        product.description.ilike.%${params.search}%,
        product.title.ilike.%${params.search}%,
        title_override.ilike.%${params.search}%,
        description_override.ilike.%${params.search}%,
        notes.ilike.%${params.search}%
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
            throw error;
        }

        return {
            businessProducts: (data ?? []) as BusinessProduct[],
            total: count ?? 0,
        };
    } catch (error: any) {
        console.error('[fetchBusinessProducts] Unexpected error:', error);
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
        title?: string;
        description?: string;
        category?: string;
        image_url?: string;
        status?: string;
        searchable?: boolean;
    }
): Promise<Product | null> {
    try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
            .from('products')
            .insert({
                name: productData.name,
                title: productData.title || productData.name,
                description: productData.description || null,
                category: productData.category || null,
                image_url: productData.image_url || null,
                status: productData.status || 'active',
                searchable: productData.searchable ?? true,
            })
            .select()
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
        title_override?: string | null;
        description_override?: string | null;
        price_from?: number | null;
        price_to?: number | null;
        currency_code?: string;
        duration_minutes?: number | null;
        booking_url?: string | null;
        notes?: string | null;
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
                title_override: linkData.title_override || null,
                description_override: linkData.description_override || null,
                price_from: linkData.price_from || null,
                price_to: linkData.price_to || null,
                currency_code: linkData.currency_code || 'SCR',
                duration_minutes: linkData.duration_minutes || null,
                booking_url: linkData.booking_url || null,
                notes: linkData.notes || null,
                is_active: linkData.is_active ?? true,
            })
            .select(`
        *,
        product:products(*),
        business:businesses(*)
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
        title_override: string | null;
        description_override: string | null;
        price_from: number | null;
        price_to: number | null;
        currency_code: string;
        duration_minutes: number | null;
        booking_url: string | null;
        notes: string | null;
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
        *,
        product:products(*),
        business:businesses(*)
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
            .eq('status', 'active')
            .order('name');

        if (error) {
            console.error('[fetchAllProducts] Error:', error);
            return [];
        }

        return (data ?? []) as Product[];
    } catch (error) {
        console.error('[fetchAllProducts] Unexpected error:', error);
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
        title_override?: string | null;
        description_override?: string | null;
        price_from?: number | null;
        price_to?: number | null;
        currency_code?: string;
        duration_minutes?: number | null;
        booking_url?: string | null;
        notes?: string | null;
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
        title_override?: string | null;
        description_override?: string | null;
        price_from?: number | null;
        price_to?: number | null;
        currency_code?: string;
        duration_minutes?: number | null;
        booking_url?: string | null;
        notes?: string | null;
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
        title_override,
        description_override,
        price_from,
        price_to,
        currency_code,
        duration_minutes,
        booking_url,
        notes,
        is_active,
        created_at,
        updated_at,
        business:businesses(
            id,
            name,
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
        title_override?: string | null;
        description_override?: string | null;
        price_from?: number | null;
        price_to?: number | null;
        currency_code?: string;
        duration_minutes?: number | null;
        booking_url?: string | null;
        notes?: string | null;
        is_active?: boolean;
    } = {}
): Promise<BusinessProduct | null> {
    return attachProductToBusiness(productId, businessId, overrides);
}

