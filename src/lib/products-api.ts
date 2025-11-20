/**
 * Products API Helper
 * 
 * Handles product operations using the many-to-many business_products model:
 * - products = master catalogue (no business_id)
 * - business_products = business-specific instance with pricing, duration, notes
 */

import { supabase } from "@/integrations/supabase/client";

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
    is_active: boolean;
    booking_url: string | null;
    notes: string | null;
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
 * Fetch business products with filters
 */
export async function fetchBusinessProducts(
    params: BusinessProductListParams = {}
): Promise<{ businessProducts: BusinessProduct[]; total: number }> {
    try {
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
        is_active,
        booking_url,
        notes,
        created_at,
        updated_at,
        business:businesses!inner (
          id,
          name,
          address,
          island
        ),
        product:products!inner (
          id,
          name,
          title,
          description,
          category,
          image_url
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
        title_override.ilike.%${params.search}%,
        description_override.ilike.%${params.search}%
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
            return { businessProducts: [], total: 0 };
        }

        return {
            businessProducts: (data ?? []) as BusinessProduct[],
            total: count ?? 0,
        };
    } catch (error) {
        console.error('[fetchBusinessProducts] Unexpected error:', error);
        return { businessProducts: [], total: 0 };
    }
}

/**
 * Create a master product (catalogue item)
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
        const { data, error } = await supabase
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
            return null;
        }

        return data as Product;
    } catch (error) {
        console.error('[createProductMaster] Unexpected error:', error);
        return null;
    }
}

/**
 * Create a business-product link
 */
export async function createBusinessProduct(
    linkData: {
        business_id: string;
        product_id: string;
        title_override?: string;
        description_override?: string;
        price_from: number;
        price_to?: number;
        currency_code?: string;
        duration_minutes?: number;
        booking_url?: string;
        notes?: string;
        is_active?: boolean;
    }
): Promise<BusinessProduct | null> {
    try {
        const { data, error } = await supabase
            .from('business_products')
            .insert({
                business_id: linkData.business_id,
                product_id: linkData.product_id,
                title_override: linkData.title_override || null,
                description_override: linkData.description_override || null,
                price_from: linkData.price_from,
                price_to: linkData.price_to || null,
                currency_code: linkData.currency_code || 'SCR',
                duration_minutes: linkData.duration_minutes || null,
                booking_url: linkData.booking_url || null,
                notes: linkData.notes || null,
                is_active: linkData.is_active ?? true,
            })
            .select(`
        *,
        business:businesses!inner (*),
        product:products!inner (*)
      `)
            .single();

        if (error) {
            console.error('[createBusinessProduct] Error:', error);
            return null;
        }

        return data as BusinessProduct;
    } catch (error) {
        console.error('[createBusinessProduct] Unexpected error:', error);
        return null;
    }
}

/**
 * Update a business-product link
 */
export async function updateBusinessProduct(
    id: string,
    updates: Partial<{
        title_override: string;
        description_override: string;
        price_from: number;
        price_to: number;
        currency_code: string;
        duration_minutes: number;
        booking_url: string;
        notes: string;
        is_active: boolean;
    }>
): Promise<BusinessProduct | null> {
    try {
        const { data, error } = await supabase
            .from('business_products')
            .update(updates)
            .eq('id', id)
            .select(`
        *,
        business:businesses!inner (*),
        product:products!inner (*)
      `)
            .single();

        if (error) {
            console.error('[updateBusinessProduct] Error:', error);
            return null;
        }

        return data as BusinessProduct;
    } catch (error) {
        console.error('[updateBusinessProduct] Unexpected error:', error);
        return null;
    }
}

/**
 * Delete a business-product link
 */
export async function deleteBusinessProduct(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('business_products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[deleteBusinessProduct] Error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[deleteBusinessProduct] Unexpected error:', error);
        return false;
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

