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
    price: number | null;
    duration: string | null;
    notes: string | null;
    is_active: boolean;
    overrides: Record<string, any>;
    created_at: string;
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
    };
}

/**
 * Master Product (catalogue item)
 */
export interface Product {
    id: string;
    name: string;
    title: string | null;
    description: string | null;
    category: string | null;
    image_url: string | null;
    status: string;
    searchable: boolean;
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
 */
export async function fetchProducts(
    params: BusinessProductListParams = {}
): Promise<{ products: any[]; total: number }> {
    try {
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });

        // Apply filters
        if (params.businessId) {
            query = query.eq('business_products.business_id', params.businessId);
        }

        if (params.isActive !== undefined) {
            query = query.eq('business_products.is_active', params.isActive);
        }

        if (params.priceMin !== undefined) {
            query = query.gte('business_products.price', params.priceMin);
        }

        if (params.priceMax !== undefined) {
            query = query.lte('business_products.price', params.priceMax);
        }

        if (params.category) {
            query = query.eq('category', params.category);
        }

        if (params.search) {
            query = query.or(`
        name.ilike.%${params.search}%,
        description.ilike.%${params.search}%,
        business_products.notes.ilike.%${params.search}%
      `);
        }

        // Apply pagination
        const limit = params.limit || 100;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1);

        // Order by creation date
        query = query.order('created_at', { ascending: false });

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
 */
export async function fetchBusinessProducts(
    params: BusinessProductListParams = {}
): Promise<{ businessProducts: BusinessProduct[]; total: number }> {
    try {
        // Use business_products as base for backward compatibility
        let query = supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        price,
        duration,
        notes,
        is_active,
        overrides,
        created_at,
        product:products(*),
        business:businesses(*)
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
            query = query.eq('product.category', params.category);
        }

        if (params.search) {
            query = query.or(`
        product.name.ilike.%${params.search}%,
        product.description.ilike.%${params.search}%,
        notes.ilike.%${params.search}%
      `);
        }

        // Apply pagination
        const limit = params.limit || 100;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1);

        // Order by creation date
        query = query.order('created_at', { ascending: false });

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
        price?: number;
        duration?: string;
        notes?: string;
        is_active?: boolean;
        overrides?: Record<string, any>;
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
                notes: linkData.notes || null,
                is_active: linkData.is_active ?? true,
                overrides: linkData.overrides || {},
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
        price: number;
        duration: string;
        notes: string;
        is_active: boolean;
        overrides: Record<string, any>;
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
            .select('*')
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
        price?: number;
        duration?: string;
        notes?: string;
        is_active?: boolean;
        [key: string]: any;
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
        price?: number;
        duration?: string;
        notes?: string;
        is_active?: boolean;
        [key: string]: any;
    }
): Promise<BusinessProduct | null> {
    return updateBusinessProduct(id, overrides);
}

